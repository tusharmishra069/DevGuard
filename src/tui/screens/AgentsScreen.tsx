import React, { useMemo } from "react";
import { Box, Text, useInput } from "ink";

export interface AgentsScreenProps {
  enabledAgents: string[];
  onChange: (agents: string[]) => void;
}

const AVAILABLE_AGENTS = [
  "bug-hunter",
  "security-scan",
  "performance-check",
  "style-guide",
  "test-coverage"
] as const;

export function AgentsScreen({ enabledAgents, onChange }: AgentsScreenProps): React.JSX.Element {
  useInput((input) => {
    const map: Record<string, (typeof AVAILABLE_AGENTS)[number]> = {
      "1": "bug-hunter",
      "2": "security-scan",
      "3": "performance-check",
      "4": "style-guide",
      "5": "test-coverage"
    };

    const selected = map[input];
    if (!selected) {
      return;
    }

    const next = enabledAgents.includes(selected)
      ? enabledAgents.filter((agent) => agent !== selected)
      : [...enabledAgents, selected];

    onChange(next);
  });

  const rows = useMemo(
    () =>
      AVAILABLE_AGENTS.map((agent, index) => {
        const active = enabledAgents.includes(agent);
        return (
          <Text key={agent} color={active ? "green" : "gray"}>
            {index + 1}. [{active ? "x" : " "}] {agent}
          </Text>
        );
      }),
    [enabledAgents]
  );

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        Agents
      </Text>
      <Text color="gray">Press 1-5 to toggle agents.</Text>
      {rows}
    </Box>
  );
}
