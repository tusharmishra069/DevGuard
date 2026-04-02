import type { Finding } from "./types.js";

export async function runTestCoverage(input: Array<{ file: string; chunk: string }>): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const entry of input) {
    const isTestFile = /\.test\.|\.spec\./.test(entry.file);
    if (!isTestFile && /new\s+feature|refactor/i.test(entry.chunk)) {
      findings.push({
        file: entry.file,
        line: 1,
        severity: "low",
        agent: "test-coverage",
        message: "Change hints at behavior updates; tests may be needed.",
        suggestion: "Add or update tests for modified behavior paths."
      });
    }
  }

  return findings;
}
