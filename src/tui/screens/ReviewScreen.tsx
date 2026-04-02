import React from "react";
import { Box, Text } from "ink";
import type { DevGuardConfig } from "../../config/schema.js";
import { Spinner } from "../components/Spinner.js";

export interface ReviewScreenProps {
  config: DevGuardConfig;
  isRunning: boolean;
}

export function ReviewScreen({ config, isRunning }: ReviewScreenProps): React.JSX.Element {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        Review Configuration
      </Text>
      <Text>Provider: {config.provider}</Text>
      <Text>Model: {config.model}</Text>
      <Text>Agents: {config.agents.join(", ")}</Text>
      <Text>Exclude: {config.exclude.join(", ") || "(none)"}</Text>
      <Text>Max file size (KB): {config.maxFileSizeKB}</Text>
      <Text color="gray">All collected code is sent to AI for review before results are shown.</Text>
      <Text color="gray">Input source: git diff if available, otherwise project source files.</Text>
      <Box marginTop={1}>{isRunning ? <Spinner label="AI review in progress" /> : <Text color="green">Press Enter to run review</Text>}</Box>
    </Box>
  );
}
