import {
  scanEnabled,
  scanRegistryEndpoint,
  scanRegistryInsecure,
} from "lib/config/env.config";
import { scanImageWithTrivy } from "./trivyScanner";

import type { TrivyScan } from "./trivyScanner";

/** Scanning is active only when enabled AND a pull endpoint is configured. */
export const scanningEnabled = (): boolean =>
  scanEnabled && !!scanRegistryEndpoint;

/**
 * Build the image ref the scanner pulls from Manifold's own registry.
 * `<endpoint>/<namespace>/<repo>@<digest>` (single-segment names drop the
 * "library" default namespace, matching OCI naming).
 */
export const scanImageRef = (
  namespace: string,
  repo: string,
  digest: string,
): string => {
  const name = namespace === "library" ? repo : `${namespace}/${repo}`;
  return `${scanRegistryEndpoint}/${name}@${digest}`;
};

/** Scan an image ref; null when the scanner (Trivy) is unavailable. */
export const scanImage = async (imageRef: string): Promise<TrivyScan | null> =>
  scanImageWithTrivy(imageRef, { insecure: scanRegistryInsecure });
