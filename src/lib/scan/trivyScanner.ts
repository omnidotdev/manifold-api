import { countTrivySeverities } from "./severity";

import type { SeverityCounts } from "./severity";

/** True when the `trivy` binary is on PATH and runnable. Cached after first check. */
let trivyPresent: boolean | undefined;
const trivyAvailable = async (): Promise<boolean> => {
  if (trivyPresent !== undefined) return trivyPresent;
  try {
    const proc = Bun.spawn(["trivy", "--version"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    trivyPresent = (await proc.exited) === 0;
  } catch {
    trivyPresent = false;
  }
  return trivyPresent;
};

export interface TrivyScan {
  scanner: "trivy";
  counts: SeverityCounts;
  findings: unknown;
}

/**
 * Scan an image reference (`<registry>/<repo>@sha256:...`) with Trivy. Trivy
 * pulls the image from the registry itself, so no local image reconstruction is
 * needed. Returns null when Trivy is not installed (graceful: the caller records
 * the scan as skipped). Throws on an actual scan failure.
 */
export const scanImageWithTrivy = async (
  imageRef: string,
  { insecure = false }: { insecure?: boolean } = {},
): Promise<TrivyScan | null> => {
  if (!(await trivyAvailable())) return null;

  const args = [
    "image",
    "--quiet",
    "--format",
    "json",
    "--scanners",
    "vuln",
    ...(insecure ? ["--insecure"] : []),
    imageRef,
  ];

  const proc = Bun.spawn(["trivy", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`trivy exited ${exitCode}: ${stderr.slice(-400)}`);
  }

  const report: unknown = JSON.parse(stdout);
  return {
    scanner: "trivy",
    counts: countTrivySeverities(report),
    findings: (report as { Results?: unknown } | null)?.Results ?? report,
  };
};
