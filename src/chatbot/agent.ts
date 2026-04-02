import fs from "node:fs/promises";
import path from "node:path";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createGroqModel } from "../providers/groq.js";

type Role = "user" | "assistant" | "tool";

interface ChatMessage {
  role: Role;
  content: string;
}

interface FinalAction {
  type: "final";
  message: string;
}

interface ToolAction {
  type: "tool";
  tool: "list_files" | "read_file" | "write_file";
  args: Record<string, unknown>;
}

type AgentAction = FinalAction | ToolAction;

export interface ChatbotOptions {
  cwd?: string;
  model?: string;
  onToolStart?: (tool: string, filePath: string) => void;
  onToolEnd?: (tool: string, filePath: string, success: boolean) => void;
}

const TOOL_EXCLUDED_DIRS = new Set([".git", "node_modules", "dist", ".agent"]);

export class GroqWorkspaceChatbot {
  private readonly cwd: string;
  private readonly modelName: string;
  private readonly llm: BaseChatModel;
  private readonly history: ChatMessage[];
  private readonly onToolStart?: (tool: string, filePath: string) => void;
  private readonly onToolEnd?: (tool: string, filePath: string, success: boolean) => void;

  public constructor(options: ChatbotOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.modelName = options.model ?? process.env.DEVGUARD_MODEL ?? "llama-3.3-70b-versatile";
    this.llm = createGroqModel(this.modelName);
    this.history = [];
    this.onToolStart = options.onToolStart;
    this.onToolEnd = options.onToolEnd;
  }

  public getModelName(): string {
    return this.modelName;
  }

  public async runTurn(userInput: string): Promise<string> {
    this.history.push({ role: "user", content: userInput });

    for (let step = 0; step < 8; step += 1) {
      const prompt = this.buildPrompt();
      const response = await this.llm.invoke(prompt);
      const text = normalizeMessageText(response.content);
      const action = parseAgentAction(text);

      if (!action) {
        this.history.push({ role: "assistant", content: text });
        return text;
      }

      if (action.type === "final") {
        this.history.push({ role: "assistant", content: action.message });
        return action.message;
      }

      const toolResult = await this.executeTool(action);
      this.history.push({ role: "tool", content: `tool=${action.tool}\n${toolResult}` });
    }

    const fallback = "I hit the tool-call limit for this turn. Please refine your request.";
    this.history.push({ role: "assistant", content: fallback });
    return fallback;
  }

  private buildPrompt(): string {
    const toolSpec = [
      "You are DevGuard Chat, a coding assistant that can edit files.",
      "You must decide each step using JSON only (no markdown code fences).",
      "Allowed outputs:",
      '{"type":"tool","tool":"list_files","args":{"path":"."}}',
      '{"type":"tool","tool":"read_file","args":{"path":"src/file.ts","startLine":1,"endLine":120}}',
      '{"type":"tool","tool":"write_file","args":{"path":"src/file.ts","content":"...full file content..."}}',
      '{"type":"final","message":"your user-facing answer"}',
      "Rules:",
      "- Use tools when you need file context or to edit files.",
      "- Paths must be relative to workspace root.",
      "- Prefer minimal edits and preserve existing style.",
      "- After edits, answer with what changed.",
      `Workspace root: ${this.cwd}`
    ].join("\n");

    const transcript = this.history.map((msg, index) => `[${index + 1}] ${msg.role.toUpperCase()}:\n${msg.content}`).join("\n\n");

    return `${toolSpec}\n\nConversation:\n${transcript}\n\nReturn only one JSON object.`;
  }

  private async executeTool(action: ToolAction): Promise<string> {
    const filePath = toRelativePath(action.args.path, action.tool === "list_files" ? "." : "");

    if (action.tool === "list_files") {
      if (this.onToolStart) {
        this.onToolStart("list_files", filePath);
      }

      const base = resolveWorkspacePath(this.cwd, filePath);
      const files = await listFiles(base, this.cwd);

      if (this.onToolEnd) {
        this.onToolEnd("list_files", filePath, true);
      }

      return JSON.stringify({ ok: true, files }, null, 2);
    }

    if (action.tool === "read_file") {
      if (this.onToolStart) {
        this.onToolStart("read_file", filePath);
      }

      const absolutePath = resolveWorkspacePath(this.cwd, filePath);
      const text = await fs.readFile(absolutePath, "utf8");
      const startLine = toOptionalPositiveNumber(action.args.startLine);
      const endLine = toOptionalPositiveNumber(action.args.endLine);
      const sliced = sliceLines(text, startLine, endLine);

      if (this.onToolEnd) {
        this.onToolEnd("read_file", filePath, true);
      }

      return JSON.stringify({ ok: true, path: filePath, content: sliced }, null, 2);
    }

    const content = typeof action.args.content === "string" ? action.args.content : "";
    const absolutePath = resolveWorkspacePath(this.cwd, filePath);

    if (this.onToolStart) {
      this.onToolStart("write_file", filePath);
    }

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, "utf8");

      if (this.onToolEnd) {
        this.onToolEnd("write_file", filePath, true);
      }

      return JSON.stringify({ ok: true, path: filePath, message: "File written" }, null, 2);
    } catch (error) {
      if (this.onToolEnd) {
        this.onToolEnd("write_file", filePath, false);
      }

      const msg = error instanceof Error ? error.message : "Unknown error";
      return JSON.stringify({ ok: false, error: msg }, null, 2);
    }
  }
}

export async function createGroqWorkspaceChatbot(options: ChatbotOptions = {}): Promise<GroqWorkspaceChatbot> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY. Add it to your .env file before using chat.");
  }

  return new GroqWorkspaceChatbot(options);
}

export function resolveWorkspacePath(cwd: string, relativePath: string): string {
  const absolutePath = path.resolve(cwd, relativePath);
  const normalizedCwd = path.resolve(cwd);
  if (absolutePath !== normalizedCwd && !absolutePath.startsWith(`${normalizedCwd}${path.sep}`)) {
    throw new Error("Path escapes workspace root.");
  }
  return absolutePath;
}

async function listFiles(base: string, cwd: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (results.length >= 300) {
      return;
    }

    const children = await fs.readdir(dir, { withFileTypes: true });
    for (const child of children) {
      if (results.length >= 300) {
        return;
      }

      const absolutePath = path.join(dir, child.name);
      const relative = path.relative(cwd, absolutePath).replaceAll(path.sep, "/");

      if (child.isDirectory()) {
        if (!TOOL_EXCLUDED_DIRS.has(child.name)) {
          await walk(absolutePath);
        }
      } else if (child.isFile()) {
        results.push(relative);
      }
    }
  }

  await walk(base);
  return results;
}

function sliceLines(text: string, startLine?: number, endLine?: number): string {
  if (!startLine && !endLine) {
    return text;
  }

  const lines = text.split("\n");
  const from = Math.max((startLine ?? 1) - 1, 0);
  const to = Math.min(endLine ?? lines.length, lines.length);
  return lines.slice(from, to).join("\n");
}

function parseAgentAction(raw: string): AgentAction | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<AgentAction>;

    if (parsed.type === "final" && typeof parsed.message === "string") {
      return { type: "final", message: parsed.message };
    }

    if (
      parsed.type === "tool" &&
      typeof parsed.tool === "string" &&
      ["list_files", "read_file", "write_file"].includes(parsed.tool)
    ) {
      return {
        type: "tool",
        tool: parsed.tool as ToolAction["tool"],
        args: typeof parsed.args === "object" && parsed.args ? parsed.args : {}
      };
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return String(content ?? "");
}

function toRelativePath(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function toOptionalPositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : undefined;
}
