import React from "react";
import { Box, Text } from "ink";
import type { Finding } from "../types.js";

function severityColor(severity: Finding["severity"]): "red" | "yellow" | "blue" {
  if (severity === "high") {
    return "red";
  }
  if (severity === "medium") {
    return "yellow";
  }
  return "blue";
}

export function FindingCard({ finding }: { finding: Finding }): React.JSX.Element {
  const lastSlash = finding.file.lastIndexOf("/");
  const folder = lastSlash >= 0 ? finding.file.slice(0, lastSlash) : ".";
  const fileName = lastSlash >= 0 ? finding.file.slice(lastSlash + 1) : finding.file;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={severityColor(finding.severity)} paddingX={1} marginBottom={1}>
      <Text>
        <Text color={severityColor(finding.severity)} bold>
          [{finding.severity.toUpperCase()}]
        </Text>{" "}
        {fileName}:{finding.line} · {finding.agent}
      </Text>
      <Text color="cyan">Path: {finding.file}</Text>
      <Text color="gray">Folder: {folder}</Text>
      <Text>{finding.message}</Text>
      {finding.suggestion ? <Text color="gray">Suggestion: {finding.suggestion}</Text> : null}
    </Box>
  );
}
