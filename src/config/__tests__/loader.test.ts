import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../loader.js";

describe("loadConfig", () => {
  it("returns defaults when file is missing", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devguard-config-"));
    const config = loadConfig(tmp);
    expect(config.provider).toBe("groq");
    expect(config.agents.length).toBeGreaterThan(0);
  });

  it("loads user config when file exists", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devguard-config-"));
    fs.writeFileSync(
      path.join(tmp, ".devguardrc"),
      JSON.stringify({ provider: "gemini", model: "gemini-1.5-pro", agents: ["security-scan"] }),
      "utf8"
    );

    const config = loadConfig(tmp);
    expect(config.provider).toBe("gemini");
    expect(config.model).toBe("gemini-1.5-pro");
    expect(config.agents).toEqual(["security-scan"]);
  });
});
