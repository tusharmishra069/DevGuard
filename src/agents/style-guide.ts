import type { Finding } from "./types.js";

export async function runStyleGuide(input: Array<{ file: string; chunk: string }>): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const entry of input) {
    if (/console\.log\(/.test(entry.chunk)) {
      findings.push({
        file: entry.file,
        line: 1,
        severity: "low",
        agent: "style-guide",
        message: "Debug logging detected.",
        suggestion: "Use structured logging or remove debug statements before merge."
      });
    }
  }

  return findings;
}
