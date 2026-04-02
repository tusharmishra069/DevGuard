import { describe, expect, it } from "vitest";
import { deduplicateFindings } from "../runner.js";

describe("deduplicateFindings", () => {
  it("removes findings with same file/line/message", () => {
    const deduped = deduplicateFindings([
      { file: "a.ts", line: 1, message: "x", severity: "low", agent: "bug-hunter" },
      { file: "a.ts", line: 1, message: "x", severity: "high", agent: "security-scan" },
      { file: "a.ts", line: 2, message: "y", severity: "low", agent: "style-guide" }
    ]);

    expect(deduped).toHaveLength(2);
  });
});
