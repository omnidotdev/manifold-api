export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
}

export const emptyCounts = (): SeverityCounts => ({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  unknown: 0,
});

/**
 * Count vulnerabilities by severity from a Trivy JSON report (the `Results[]` ->
 * `Vulnerabilities[]` shape). Pure + defensive: unknown/malformed input yields
 * zero counts rather than throwing.
 */
export const countTrivySeverities = (report: unknown): SeverityCounts => {
  const counts = emptyCounts();
  const results = (report as { Results?: unknown } | null)?.Results;
  if (!Array.isArray(results)) return counts;

  for (const result of results) {
    const vulns = (result as { Vulnerabilities?: unknown } | null)
      ?.Vulnerabilities;
    if (!Array.isArray(vulns)) continue;

    for (const vuln of vulns) {
      const severity = String(
        (vuln as { Severity?: unknown } | null)?.Severity ?? "",
      ).toUpperCase();
      switch (severity) {
        case "CRITICAL":
          counts.critical += 1;
          break;
        case "HIGH":
          counts.high += 1;
          break;
        case "MEDIUM":
          counts.medium += 1;
          break;
        case "LOW":
          counts.low += 1;
          break;
        default:
          counts.unknown += 1;
          break;
      }
    }
  }

  return counts;
};
