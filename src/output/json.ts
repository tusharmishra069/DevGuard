import type { Finding } from "../agents/types.js";

export function renderJson(findings: Finding[]): string {
  return JSON.stringify(
    {
      findings,
      summary: {
        total: findings.length,
        high: findings.filter((item) => item.severity === "high").length,
        medium: findings.filter((item) => item.severity === "medium").length,
        low: findings.filter((item) => item.severity === "low").length
      }
    },
    null,
    2
  );
}
