import { describe, expect, it } from "vitest";
import { redactSecrets } from "../redact.js";

describe("redactSecrets", () => {
  it("redacts common secret patterns", () => {
    const text = `apiKey=abcdef1234567890\npassword: supersecret\ntoken: testtoken123456789`;
    const redacted = redactSecrets(text);

    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain("supersecret");
  });
});
