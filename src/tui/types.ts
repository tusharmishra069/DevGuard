export type Severity = "low" | "medium" | "high";

export interface Finding {
  file: string;
  line: number;
  severity: Severity;
  agent: string;
  message: string;
  suggestion?: string;
}

export type Screen = "splash" | "home" | "review" | "agents" | "config" | "results" | "chat";

export type MenuAction = "review" | "agents" | "config" | "results" | "quit";

export interface TuiState {
  cwd: string;
  mode: "interactive" | "reviewing";
  model: string;
  findings: Finding[];
}
