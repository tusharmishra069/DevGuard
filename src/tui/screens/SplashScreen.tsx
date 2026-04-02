import React, { useMemo } from "react";
import figlet from "figlet";
import { Box, Text } from "ink";

export function SplashScreen(): React.JSX.Element {
  const banner = useMemo(
    () =>
      figlet.textSync("DEVGUARD", {
        horizontalLayout: "fitted"
      }),
    []
  );

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="green">{banner}</Text>
      <Text color="gray">AI-powered code review for your working tree</Text>
      <Text color="cyan">Press Enter to continue</Text>
    </Box>
  );
}
