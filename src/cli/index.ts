#!/usr/bin/env node
import "dotenv/config";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { runReview } from "../agents/runner.js";
import { startChatCli } from "../chatbot/cli.js";
import { renderJson } from "../output/json.js";
import { renderSarif } from "../output/sarif.js";
import { renderTerminal } from "../output/terminal.js";
import { writeDefaultConfig } from "./init.js";

const AVAILABLE_AGENTS = [
  "bug-hunter",
  "security-scan",
  "performance-check",
  "style-guide",
  "test-coverage"
] as const;

interface ReviewOptions {
  staged?: boolean;
  branch?: string;
  agent?: string;
  json?: boolean;
  sarif?: boolean;
}

interface ChatOptions {
  cwd?: string;
  model?: string;
}

async function main(): Promise<void> {
  const program = new Command();

  program.name("devguard").description("AI-powered code review CLI").version("1.0.0");

  program
    .command("review")
    .description("Run code review")
    .option("--staged", "Review staged changes")
    .option("--branch <name>", "Review diff against branch")
    .option("--agent <name>", "Run a single agent")
    .option("--json", "Output JSON")
    .option("--sarif", "Output SARIF")
    .action(async (options: ReviewOptions) => {
      const findings = await runReview({ staged: options.staged, branch: options.branch });
      const filtered = options.agent ? findings.filter((item) => item.agent === options.agent) : findings;

      if (options.sarif) {
        process.stdout.write(`${renderSarif(filtered)}\n`);
        return;
      }

      if (options.json) {
        process.stdout.write(`${renderJson(filtered)}\n`);
        return;
      }

      process.stdout.write(`${renderTerminal(filtered)}\n`);
    });

  program
    .command("init")
    .description("Create a default .devguardrc")
    .action(() => {
      const filePath = writeDefaultConfig();
      process.stdout.write(`Created or reused ${filePath}\n`);
    });

  program
    .command("agents")
    .description("List all available agents")
    .action(() => {
      for (const agent of AVAILABLE_AGENTS) {
        process.stdout.write(`${agent}\n`);
      }
    });

  program
    .command("chat")
    .description("Start Groq-powered interactive coding chat")
    .option("--cwd <path>", "Workspace root for file tools")
    .option("--model <name>", "Groq model name")
    .action(async (options: ChatOptions) => {
      await startChatCli({ cwd: options.cwd, model: options.model });
    });

  if (process.argv.length <= 2) {
    launchTui();
    return;
  }

  await program.parseAsync(process.argv);
}

function launchTui(): void {
  const tuiEntry = fileURLToPath(new URL("../tui/index.js", import.meta.url));
  const child = spawn(process.execPath, [tuiEntry], {
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

void main();
