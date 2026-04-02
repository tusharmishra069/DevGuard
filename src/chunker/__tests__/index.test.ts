import { describe, expect, it } from "vitest";
import { chunkDiffs } from "../index.js";

describe("chunkDiffs", () => {
  it("splits large patches into chunks", async () => {
    const longPatch = "a".repeat(7000);
    const chunks = await chunkDiffs([{ file: "src/file.ts", patch: longPatch }]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((entry) => entry.file === "src/file.ts")).toBe(true);
  });
});
