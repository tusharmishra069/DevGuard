import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { DevGuardConfig } from "../../config/schema.js";

export function ConfigScreen({ config }: { config: DevGuardConfig }): React.JSX.Element {
  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        .devguardrc
      </Text>
      <Text color="gray">Edit this file in your project root to update settings.</Text>
      <Text>{json}</Text>
    </Box>
  );
}
