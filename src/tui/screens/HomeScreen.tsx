import React, { useState } from "react";
import { Box, Text } from "ink";
import { Menu } from "../components/Menu.js";
import { Prompt } from "../components/Prompt.js";
import type { MenuAction } from "../types.js";

export interface HomeScreenProps {
  onNavigate: (action: MenuAction) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps): React.JSX.Element {
  const [promptValue, setPromptValue] = useState("");

  const items = [
    { label: "Review Code", description: "Run all enabled agents", value: "review" },
    { label: "Agents", description: "Toggle enabled agents", value: "agents" },
    { label: "Config", description: "View/edit .devguardrc", value: "config" },
    { label: "Results", description: "View latest findings", value: "results" },
    { label: "Quit", description: "Exit DevGuard", value: "quit" }
  ];

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        Tips
      </Text>
      <Text color="gray">• Use ↑/↓ to move menu, Enter to select.</Text>
      <Text color="gray">• Press q anytime to quit, Esc to go back.</Text>
      <Box marginTop={1} marginBottom={1}>
        <Prompt
          value={promptValue}
          placeholder="Try: review staged changes"
          onChange={setPromptValue}
          onSubmit={(value) => {
            const normalized = value.trim().toLowerCase();
            if (normalized.includes("review")) {
              onNavigate("review");
            } else if (normalized.includes("agent")) {
              onNavigate("agents");
            } else if (normalized.includes("config")) {
              onNavigate("config");
            }
            setPromptValue("");
          }}
        />
      </Box>
      <Menu items={items} onSelect={(value) => onNavigate(value as MenuAction)} />
    </Box>
  );
}
