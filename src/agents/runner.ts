import fs from "node:fs/promises";
import path from "node:path";
import pMap from "p-map";
import { chunkDiffs } from "../chunker/index.js";
import { loadConfig } from "../config/loader.js";
import { getDiff } from "../git/diff.js";
import { createGroqModel } from "../providers/groq.js";
import { createProviderModel } from "../providers/index.js";
import { redactSecrets } from "../security/redact.js";
import { runBugHunter } from "./bug-hunter.js";
import { runPerformanceCheck } from "./performance-check.js";
import { runSecurityScan } from "./security-scan.js";
import { runStyleGuide } from "./style-guide.js";
import { runTestCoverage } from "./test-coverage.js";
import type { Finding } from "./types.js";
import type { DevGuardConfig } from "../config/schema.js";

export interface RunReviewOptions {
  cwd?: string;
  staged?: boolean;
  branch?: string;
  configOverride?: DevGuardConfig;
}

const REVIEWABLE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const DEFAULT_EXCLUDED_DIRS = new Set([".git", "node_modules", "dist", ".agent"]);
const MAX_AI_CHUNKS = 40;
const FALLBACK_AI_CHUNKS = 12;
const GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant";

const STATIC_AGENT_MAP = {
  "bug-hunter": runBugHunter,
  "security-scan": runSecurityScan,
  "performance-check": runPerformanceCheck,
  "style-guide": runStyleGuide,
  "test-coverage": runTestCoverage
} as const;

export async function runReview(options: RunReviewOptions = {}): Promise<Finding[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = options.configOverride ?? loadConfig(cwd);
  let reviewEntries = await getDiff({ cwd, staged: options.staged, branch: options.branch });

  if (reviewEntries.length === 0) {
    reviewEntries = await collectProjectEntries(cwd, config);
  }

  if (reviewEntries.length === 0) {
    return [];
  }

  const redactedEntries = reviewEntries.map((entry) => ({
    ...entry,
    patch: redactSecrets(entry.patch)
  }));

  const chunks = await chunkDiffs(redactedEntries);
  try {
    const primaryFindings = await runAiReview(chunks.slice(0, MAX_AI_CHUNKS), config);
    return deduplicateFindings(primaryFindings);
  } catch (error: unknown) {
    if (config.provider === "groq" && isRateLimitError(error) && config.model !== GROQ_FALLBACK_MODEL) {
      try {
        const retryConfig: DevGuardConfig = { ...config, model: GROQ_FALLBACK_MODEL };
        const retriedFindings = await runAiReview(chunks.slice(0, FALLBACK_AI_CHUNKS), retryConfig);
        return deduplicateFindings([
          {
            file: "review",
            line: 1,
            severity: "low",
            agent: "system",
            message: "Primary Groq model hit rate limit. Used fallback model for this review.",
            suggestion: "If this happens often, lower reviewed scope or wait for quota reset."
          },
          ...retriedFindings
        ]);
      } catch (retryError: unknown) {
        const fallbackFindings = await runStaticFallback(chunks, config);
        return deduplicateFindings([
          {
            file: "review",
            line: 1,
            severity: "medium",
            agent: "system",
            message: "AI rate limit reached; showing static fallback findings.",
            suggestion: formatErrorSuggestion(retryError)
          },
          ...fallbackFindings
        ]);
      }
    }

    const fallbackFindings = await runStaticFallback(chunks, config);
    return deduplicateFindings([
      {
        file: "review",
        line: 1,
        severity: "medium",
        agent: "system",
        message: "AI review unavailable; showing static fallback findings.",
        suggestion: formatErrorSuggestion(error)
      },
      ...fallbackFindings
    ]);
  }
}

async function collectProjectEntries(cwd: string, config: DevGuardConfig): Promise<Array<{ file: string; patch: string }>> {
  const maxBytes = config.maxFileSizeKB * 1024;
  const entries: Array<{ file: string; patch: string }> = [];

  async function walk(dir: string): Promise<void> {
    const children = await fs.readdir(dir, { withFileTypes: true });

    for (const child of children) {
      const absolutePath = path.join(dir, child.name);
      const relativePath = path.relative(cwd, absolutePath).replaceAll(path.sep, "/");

      if (isExcluded(relativePath, config.exclude)) {
        continue;
      }

      if (child.isDirectory()) {
        if (!DEFAULT_EXCLUDED_DIRS.has(child.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (!child.isFile()) {
        continue;
      }

      if (!REVIEWABLE_EXTENSIONS.has(path.extname(child.name))) {
        continue;
      }

      const stat = await fs.stat(absolutePath);
      if (stat.size > maxBytes) {
        continue;
      }

      const text = await fs.readFile(absolutePath, "utf8");
      entries.push({
        file: relativePath,
        patch: text
      });
    }
  }

  await walk(cwd);
  return entries;
}

function isExcluded(relativePath: string, configuredExclude: string[]): boolean {
  return configuredExclude.some((pattern) => {
    const normalized = pattern.replace(/^\.\//, "").replaceAll("\\", "/");
    return relativePath === normalized || relativePath.startsWith(`${normalized}/`) || relativePath.includes(`/${normalized}/`);
  });
}

export function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const unique: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.file}:${finding.line}:${finding.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }

  return unique;
}

function buildAiReviewPrompt(file: string, chunk: string, enabledAgents: string[]): string {
  return [
    "You are DevGuard AI reviewer.",
    `Enabled review lenses: ${enabledAgents.join(", ")}`,
    "Review the provided code chunk and return STRICT JSON only.",
    "JSON schema:",
    '{"findings":[{"line":number,"severity":"low|medium|high","agent":"string","message":"string","suggestion":"string"}] }',
    "Rules:",
    "- Include only real, actionable issues.",
    "- If there are no issues, return {\"findings\":[]}.",
    "- Keep message and suggestion concise.",
    `File: ${file}`,
    "Code:",
    chunk
  ].join("\n");
}

function normalizeModelText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object" && "text" in entry && typeof entry.text === "string") {
          return entry.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return String(content ?? "");
}

function parseAiFindings(raw: string, file: string): Finding[] {
  const jsonBlock = extractJson(raw);
  if (!jsonBlock) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonBlock) as { findings?: unknown };
    const list = Array.isArray(parsed.findings) ? parsed.findings : [];
    return list
      .map((entry) => normalizeFinding(entry, file))
      .filter((entry): entry is Finding => entry !== null);
  } catch {
    return [];
  }
}

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }

  return trimmed.slice(start, end + 1);
}

function normalizeFinding(input: unknown, file: string): Finding | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const obj = input as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message.trim() : "";
  if (!message) {
    return null;
  }

  const severityRaw = typeof obj.severity === "string" ? obj.severity.toLowerCase() : "low";
  const severity: Finding["severity"] =
    severityRaw === "high" || severityRaw === "medium" || severityRaw === "low" ? severityRaw : "low";

  const lineRaw = typeof obj.line === "number" && Number.isFinite(obj.line) ? Math.floor(obj.line) : 1;
  const line = Math.max(1, lineRaw);

  const agent = typeof obj.agent === "string" && obj.agent.trim() ? obj.agent.trim() : "ai-review";
  const suggestion = typeof obj.suggestion === "string" && obj.suggestion.trim() ? obj.suggestion.trim() : undefined;

  return {
    file,
    line,
    severity,
    agent,
    message,
    suggestion
  };
}

async function runAiReview(
  chunks: Array<{ file: string; chunk: string }>,
  config: DevGuardConfig
): Promise<Finding[]> {
  const model =
    config.provider === "groq" ? createGroqModel(config.model) : createProviderModel(config);

  const results = await pMap(
    chunks,
    async (entry) => {
      const prompt = buildAiReviewPrompt(entry.file, entry.chunk, config.agents);
      const response = await model.invoke(prompt);
      const responseText = normalizeModelText(response.content);
      return parseAiFindings(responseText, entry.file);
    },
    { concurrency: 3 }
  );

  return results.flat();
}

async function runStaticFallback(
  chunks: Array<{ file: string; chunk: string }>,
  config: DevGuardConfig
): Promise<Finding[]> {
  const selectedAgents = config.agents.filter(
    (agent): agent is keyof typeof STATIC_AGENT_MAP => agent in STATIC_AGENT_MAP
  );

  const results = await pMap(
    selectedAgents,
    async (agentName) => {
      const runAgent = STATIC_AGENT_MAP[agentName];
      return runAgent(chunks);
    },
    { concurrency: 3 }
  );

  return results.flat();
}

function isRateLimitError(error: unknown): boolean {
  const text = formatErrorSuggestion(error).toLowerCase();
  return text.includes("rate limit") || text.includes("rate_limit") || text.includes("429");
}

function formatErrorSuggestion(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
