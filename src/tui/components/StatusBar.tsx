import React from "react";
import { Box, Text } from "ink";

export interface StatusBarProps {
  cwd: string;
  model: string;
  mode: string;
}

export function StatusBar({ cwd, model, mode }: StatusBarProps): React.JSX.Element {
  return (
    <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="gray">
      <Text color="gray">CWD: {cwd}</Text>
      <Text color="gray">Model: {model}</Text>
      <Text color="gray">Mode: {mode}</Text>
    </Box>
  );
}
