import type { Finding } from "./types.js";

export interface AgentDefinition {
  name: string;
  systemPrompt: string;
}

export function createStaticAgent(definition: AgentDefinition): (file: string, chunk: string) => Finding[] {
  return (file, chunk) => {
    const findings: Finding[] = [];
    const normalized = chunk.toLowerCase();

    if (/todo|fixme/.test(normalized)) {
      findings.push({
        file,
        line: 1,
        severity: "low",
        agent: definition.name,
        message: "Contains TODO/FIXME markers that may hide incomplete work.",
        suggestion: "Convert TODOs into tracked issues or resolve them before merge."
      });
    }

    if (/any\b|@ts-ignore/.test(normalized)) {
      findings.push({
        file,
        line: 1,
        severity: "medium",
        agent: definition.name,
        message: "Potentially unsafe typing pattern detected.",
        suggestion: "Use explicit types and avoid suppressing TypeScript checks."
      });
    }

    return findings;
  };
}
