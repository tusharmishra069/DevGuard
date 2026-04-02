import type { WriteStream } from "node:tty";

export class ChatAnimations {
  private output: WriteStream;

  constructor(output: WriteStream = process.stdout) {
    this.output = output;
  }

  showFileOp(operation: string, filePath: string): void {
    const icons: Record<string, string> = {
      creating: "✨",
      editing: "✏️",
      reading: "📖"
    };
    const icon = icons[operation] || "📝";
    this.output.write(`\n${icon} ${operation}: ${filePath}\n`);
  }

  showFileOpDone(filePath: string): void {
    this.output.write(`✅ Done: ${filePath}\n\n`);
  }

  showAnalyzing(): void {
    this.output.write("\n🤖 Analyzing...\n");
  }

  showSuccess(message: string): void {
    this.output.write(`\n✅ ${message}\n\n`);
  }

  showError(message: string): void {
    this.output.write(`\n❌ ${message}\n\n`);
  }

  showInfo(message: string): void {
    this.output.write(`\nℹ️  ${message}\n\n`);
  }
}
