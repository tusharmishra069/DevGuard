import React, { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";

export interface SpinnerProps {
  label: string;
}

export function Spinner({ label }: SpinnerProps): React.JSX.Element {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 280);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const trail = useMemo(() => ".".repeat((tick % 3) + 1), [tick]);
  const phase = useMemo(() => {
    const phases = ["Collecting code", "Sending to AI", "Evaluating findings", "Finalizing results"];
    return phases[tick % phases.length] ?? phases[0];
  }, [tick]);

  return (
    <Box flexDirection="column">
      <Text color="yellow">
        <InkSpinner type="dots" /> {label}
      </Text>
      <Text color="cyan">
        {phase}
        {trail}
      </Text>
    </Box>
  );
}
