import fs from "node:fs";
import path from "node:path";
import { configSchema, defaultConfig, type DevGuardConfig } from "./schema.js";

export function loadConfig(cwd: string = process.cwd()): DevGuardConfig {
  const rcPath = path.join(cwd, ".devguardrc");
  if (!fs.existsSync(rcPath)) {
    return withEnv(defaultConfig);
  }

  try {
    const raw = fs.readFileSync(rcPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const safeParsed = parsed !== null && typeof parsed === "object" ? parsed : {};
    const merged = configSchema.parse({ ...defaultConfig, ...safeParsed });
    return withEnv(merged);
  } catch {
    return withEnv(defaultConfig);
  }
}

function withEnv(config: DevGuardConfig): DevGuardConfig {
  const provider = process.env.DEVGUARD_PROVIDER;
  const model = process.env.DEVGUARD_MODEL;

  return configSchema.parse({
    ...config,
    provider: provider ?? config.provider,
    model: model ?? config.model
  });
}
