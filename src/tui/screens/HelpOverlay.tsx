import React from "react";
import { Box, Text } from "ink";

export function HelpOverlay(): React.JSX.Element {
  return (
    <Box borderStyle="double" borderColor="magenta" paddingX={1} flexDirection="column" marginTop={1}>
      <Text color="magenta" bold>
        Keybindings
      </Text>
      <Text>Enter: confirm/select</Text>
      <Text>↑/↓: navigate menu</Text>
      <Text>Esc: go back</Text>
      <Text>q: quit</Text>
      <Text>Ctrl+h: toggle help</Text>
    </Box>
  );
}
