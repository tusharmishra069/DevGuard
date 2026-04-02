import { createStaticAgent } from "./base.js";
import type { Finding } from "./types.js";

const evaluate = createStaticAgent({
  name: "bug-hunter",
  systemPrompt: "Find likely runtime bugs."
});

export async function runBugHunter(input: Array<{ file: string; chunk: string }>): Promise<Finding[]> {
  return input.flatMap((entry) => evaluate(entry.file, entry.chunk));
}
