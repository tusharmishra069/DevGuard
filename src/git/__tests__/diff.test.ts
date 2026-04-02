import { describe, expect, it } from "vitest";
import { splitDiff } from "../diff.js";

describe("splitDiff", () => {
  it("parses multiple git patch sections", () => {
    const input = `diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +1 @@\n-const a = 1\n+const a = 2\ndiff --git a/src/b.ts b/src/b.ts\n--- a/src/b.ts\n+++ b/src/b.ts\n@@ -1 +1 @@\n-console.log(1)\n+console.log(2)`;

    const result = splitDiff(input);

    expect(result).toHaveLength(2);
    expect(result[0]?.file).toBe("src/a.ts");
    expect(result[1]?.file).toBe("src/b.ts");
  });
});
