import type { Finding } from "./types.js";

export async function runSecurityScan(input: Array<{ file: string; chunk: string }>): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const entry of input) {
    const normalized = entry.chunk.toLowerCase();

    if (/eval\(|new function\(/.test(normalized)) {
      findings.push({
        file: entry.file,
        line: 1,
        severity: "high",
        agent: "security-scan",
        message: "Dynamic code execution pattern detected.",
        suggestion: "Avoid `eval` and use safer parsing or dispatch alternatives."
      });
    }

    if (/innerhtml\s*=/.test(normalized)) {
      findings.push({
        file: entry.file,
        line: 1,
        severity: "medium",
        agent: "security-scan",
        message: "Potential DOM injection sink detected.",
        suggestion: "Use text-safe APIs or sanitize untrusted content."
      });
    }
  }

  return findings;
}
