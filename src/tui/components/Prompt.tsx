import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export interface PromptProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function Prompt({ value, placeholder, onChange, onSubmit }: PromptProps): React.JSX.Element {
  return (
    <Box>
      <Text color="green">&gt; </Text>
      <TextInput value={value} placeholder={placeholder} onChange={onChange} onSubmit={onSubmit} />
    </Box>
  );
}
