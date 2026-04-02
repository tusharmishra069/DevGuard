import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Finding } from "../agents/types.js";

export async function promptFixApplication(findings: Finding[]): Promise<boolean> {
  if (findings.length === 0) {
    return false;
  }

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question("Apply suggested fixes interactively? (y/N) ");
  rl.close();
  return answer.trim().toLowerCase() === "y";
}
