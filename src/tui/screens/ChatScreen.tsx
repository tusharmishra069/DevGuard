import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { Finding } from "../types.js";
import { GroqWorkspaceChatbot } from "../../chatbot/agent.js";

export function ChatScreen({
  findings,
  onClose,
}: {
  findings: Finding[];
  onClose: () => void;
}): React.JSX.Element {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant" | "status"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [chatbot] = useState(() => new GroqWorkspaceChatbot({
    onToolStart: (tool, filePath) => {
      const icons: Record<string, string> = {
        write_file: "✨",
        read_file: "📖",
        list_files: "📁"
      };
      const icon = icons[tool] || "📝";
      setStatus(`${icon} ${tool}: ${filePath}`);
    },
    onToolEnd: (tool, filePath, success) => {
      if (success) {
        setStatus(`✅ Done: ${filePath}`);
        setTimeout(() => setStatus(""), 500);
      } else {
        setStatus(`❌ Failed: ${filePath}`);
        setTimeout(() => setStatus(""), 800);
      }
    }
  }));

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);
    setStatus("🤖 Analyzing...");

    try {
      const response = await chatbot.runTurn(userMessage);
      setStatus("");
      setMessages((prev) => [...prev, { role: "assistant", text: response }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Chat error";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${errorMsg}` }]);
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    }
  });

  const visibleMessages = messages.slice(-7);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        💬 Chat About Findings
      </Text>
      {findings.length > 0 ? (
        <Text color="gray">
          Issues found: {findings.length}. Ask AI to help fix them or explain.
        </Text>
      ) : null}

      <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="blue" paddingX={1}>
        {visibleMessages.length === 0 ? (
          <Text color="gray">Start typing to chat about the review findings...</Text>
        ) : (
          visibleMessages.map((msg, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={0.5}>
              <Text color={msg.role === "user" ? "green" : msg.role === "status" ? "yellow" : "cyan"} bold>
                {msg.role === "user" ? "You" : msg.role === "status" ? "Status" : "AI"}:
              </Text>
              <Text color={msg.role === "user" ? "green" : msg.role === "status" ? "yellow" : "cyan"}>{msg.text}</Text>
            </Box>
          ))
        )}
        {status ? (
          <Box flexDirection="column" marginBottom={0.5}>
            <Text color="yellow">{status}</Text>
          </Box>
        ) : null}
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text>›</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Ask AI to fix issues, read files, or explain findings..."
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Esc: back to results • Type and press Enter to chat</Text>
      </Box>
    </Box>
  );
}
