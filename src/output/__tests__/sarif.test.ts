import { describe, expect, it } from "vitest";
import { renderSarif } from "../sarif.js";

describe("renderSarif", () => {
  it("emits SARIF 2.1.0", () => {
    const output = renderSarif([
      { file: "src/a.ts", line: 2, severity: "medium", agent: "bug-hunter", message: "Possible bug" }
    ]);

    const parsed = JSON.parse(output) as { version: string; runs: unknown[] };
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs.length).toBe(1);
  });
});
