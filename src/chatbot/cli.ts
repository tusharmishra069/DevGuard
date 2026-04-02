import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createGroqWorkspaceChatbot } from "./agent.js";
import { ChatAnimations } from "./animations.js";

export interface ChatCliOptions {
  cwd?: string;
  model?: string;
}

export async function startChatCli(options: ChatCliOptions = {}): Promise<void> {
  const animations = new ChatAnimations(output);
  
  const bot = await createGroqWorkspaceChatbot({
    cwd: options.cwd,
    model: options.model,
    onToolStart: (tool, filePath) => {
      if (tool === "write_file") {
        animations.showFileOp("creating", filePath);
      } else if (tool === "read_file") {
        animations.showFileOp("reading", filePath);
      }
    },
    onToolEnd: (tool, filePath, success) => {
      if (success) {
        animations.showFileOpDone(filePath);
      } else {
        animations.showError(`Failed to ${tool} ${filePath}`);
      }
    }
  });

  const rl = readline.createInterface({ input, output });

  output.write(`\n🤖 DevGuard Chat (Groq: ${bot.getModelName()})\n`);
  output.write("💬 Type your request. Use 'exit' to quit.\n");
  output.write("═".repeat(60) + "\n\n");

  try {
    while (true) {
      const userInput = await rl.question("you> ");
      const normalized = userInput.trim().toLowerCase();
      if (normalized === "exit" || normalized === "quit") {
        output.write("\n👋 bye\n");
        break;
      }

      if (!userInput.trim()) {
        continue;
      }

      animations.showAnalyzing();
      const reply = await bot.runTurn(userInput);
      output.write(`🤖 devguard> ${reply}\n\n`);
    }
  } finally {
    rl.close();
  }
}
