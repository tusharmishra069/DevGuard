export type Severity = "low" | "medium" | "high";

export interface Finding {
  file: string;
  line: number;
  severity: Severity;
  agent: string;
  message: string;
  suggestion?: string;
}

export interface AgentContext {
  file: string;
  chunk: string;
}

export type AgentRunner = (input: AgentContext[]) => Promise<Finding[]>;
