import chalk from "chalk";
import Table from "cli-table3";
import type { Finding } from "../agents/types.js";

export function renderTerminal(findings: Finding[]): string {
  if (findings.length === 0) {
    return chalk.green("✓ No findings");
  }

  const table = new Table({
    head: ["Severity", "File", "Line", "Agent", "Message"],
    style: { head: ["cyan"] }
  });

  for (const finding of findings) {
    const severity =
      finding.severity === "high"
        ? chalk.red("HIGH")
        : finding.severity === "medium"
          ? chalk.yellow("MED")
          : chalk.blue("LOW");

    table.push([severity, finding.file, String(finding.line), finding.agent, finding.message]);
  }

  return table.toString();
}
