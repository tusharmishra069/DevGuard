import { describe, expect, it } from "vitest";
import { renderJson } from "../json.js";

describe("renderJson", () => {
  it("returns parseable JSON with summary", () => {
    const text = renderJson([
      { file: "src/a.ts", line: 1, severity: "high", agent: "security-scan", message: "Issue" }
    ]);

    const parsed = JSON.parse(text) as { summary: { total: number; high: number } };
    expect(parsed.summary.total).toBe(1);
    expect(parsed.summary.high).toBe(1);
  });
});
