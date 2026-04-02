import type { Finding } from "../agents/types.js";

export function renderSarif(findings: Finding[]): string {
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "DevGuard",
            version: "1.0.0",
            informationUri: "https://example.com/devguard",
            rules: [] as Array<{ id: string; name: string; shortDescription: { text: string } }>
          }
        },
        results: findings.map((finding, index) => ({
          ruleId: `${finding.agent}-${index + 1}`,
          level: finding.severity === "high" ? "error" : finding.severity === "medium" ? "warning" : "note",
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file },
                region: { startLine: finding.line }
              }
            }
          ]
        }))
      }
    ]
  };

  return JSON.stringify(sarif, null, 2);
}
