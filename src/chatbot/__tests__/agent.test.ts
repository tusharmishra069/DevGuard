import { describe, expect, it } from "vitest";
import { resolveWorkspacePath } from "../agent.js";

describe("resolveWorkspacePath", () => {
  it("resolves a safe relative path", () => {
    const resolved = resolveWorkspacePath("/tmp/work", "src/index.ts");
    expect(resolved).toBe("/tmp/work/src/index.ts");
  });

  it("throws when path escapes workspace", () => {
    expect(() => resolveWorkspacePath("/tmp/work", "../secret.txt")).toThrowError(
      "Path escapes workspace root."
    );
  });
});
