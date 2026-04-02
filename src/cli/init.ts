import fs from "node:fs";
import path from "node:path";
import { defaultConfig } from "../config/schema.js";

export function writeDefaultConfig(cwd: string = process.cwd()): string {
  const target = path.join(cwd, ".devguardrc");
  if (fs.existsSync(target)) {
    return target;
  }

  fs.writeFileSync(target, `${JSON.stringify(defaultConfig, null, 2)}\n`, "utf8");
  return target;
}
