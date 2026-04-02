import type { Finding } from "./types.js";

export async function runPerformanceCheck(input: Array<{ file: string; chunk: string }>): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const entry of input) {
    const normalized = entry.chunk.toLowerCase();
    if (/for\s*\(.*\)\s*\{[\s\S]{0,600}for\s*\(/.test(normalized)) {
      findings.push({
        file: entry.file,
        line: 1,
        severity: "medium",
        agent: "performance-check",
        message: "Nested loops may lead to quadratic growth.",
        suggestion: "Consider indexing or batching to reduce repeated scans."
      });
    }
  }

  return findings;
}
