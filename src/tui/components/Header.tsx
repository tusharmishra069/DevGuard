import React from "react";
import { Box, Text } from "ink";

export interface HeaderProps {
  version: string;
}

export function Header({ version }: HeaderProps): React.JSX.Element {
  return (
    <Box justifyContent="space-between" paddingX={1} borderStyle="round" borderColor="cyan">
      <Text color="cyan" bold>
        DevGuard
      </Text>
      <Text color="gray">v{version}</Text>
    </Box>
  );
}
