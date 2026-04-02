import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Finding } from "../types.js";
import { FindingCard } from "../components/FindingCard.js";

export function ResultsScreen({
  findings,
  onChat,
}: {
  findings: Finding[];
  onChat?: () => void;
}): React.JSX.Element {
  const [offset, setOffset] = useState(0);

  useInput((_, key) => {
    if (key.downArrow) {
      setOffset((current) => Math.min(current + 1, Math.max(0, findings.length - 1)));
    }

    if (key.upArrow) {
      setOffset((current) => Math.max(current - 1, 0));
    }

    if (key.return && onChat) {
      onChat();
    }
  });

  const visible = useMemo(() => findings.slice(offset, offset + 8), [findings, offset]);
  const folderSummary = useMemo(() => summarizeByFolder(findings).slice(0, 6), [findings]);
  const fileSummary = useMemo(() => summarizeByFile(findings).slice(0, 8), [findings]);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">
        Findings
      </Text>
      {findings.length === 0 ? <Text color="gray">No findings yet. Run a review first.</Text> : null}
      {findings.length > 0 ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="magenta">
            Folder Issue Map
          </Text>
          {folderSummary.map((entry) => (
            <Text key={entry.name}>
              • {entry.name} — {entry.count} issue{entry.count === 1 ? "" : "s"}
            </Text>
          ))}
          <Text bold color="magenta">
            File Issue Map
          </Text>
          {fileSummary.map((entry) => (
            <Text key={entry.name}>
              • {entry.name} — {entry.count} issue{entry.count === 1 ? "" : "s"}
            </Text>
          ))}
        </Box>
      ) : null}
      {visible.map((finding, index) => (
        <FindingCard key={`${finding.file}-${finding.line}-${finding.message}-${index}`} finding={finding} />
      ))}
      {findings.length > 8 ? <Text color="gray">Showing {offset + 1}-{Math.min(offset + 8, findings.length)} of {findings.length}</Text> : null}
      {onChat ? (
        <Box marginTop={1}>
          <Text color="cyan" bold>
            💬 Press Enter to chat about findings and fix issues
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

function summarizeByFolder(findings: Finding[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  for (const finding of findings) {
    const index = finding.file.lastIndexOf("/");
    const folder = index >= 0 ? finding.file.slice(0, index) : ".";
    counts.set(folder, (counts.get(folder) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function summarizeByFile(findings: Finding[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  for (const finding of findings) {
    counts.set(finding.file, (counts.get(finding.file) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
