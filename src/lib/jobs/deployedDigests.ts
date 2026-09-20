import { readFileSync } from "node:fs";

/**
 * @file Resolve the set of image digests currently in use by the Fractal fleet,
 * so tag retention never garbage-collects a deployed image or its rollback
 * target (the 2026-09-19 vortex-worker incident: a rollback digest had been
 * GC'd, so the rolled-to pod hit ErrImagePull).
 */

const K8S_API = "https://kubernetes.default.svc";
const FRACTALSERVICES_PATH = "/apis/fractal.omni.dev/v1alpha1/fractalservices";
const SA_DIR = "/var/run/secrets/kubernetes.io/serviceaccount";

const readServiceAccountFile = (file: string): string | null => {
  try {
    return readFileSync(`${SA_DIR}/${file}`, "utf8");
  } catch {
    return null;
  }
};

/**
 * Extract the `sha256:...` manifest digest from an image ref, or `null` for a
 * bare tag ref (`repo:tag`). Fractal pins deploys by digest, so deployed images
 * carry a `@sha256:` suffix.
 */
export const digestFromImageRef = (image: unknown): string | null => {
  if (typeof image !== "string") return null;
  const at = image.indexOf("@");
  if (at === -1) return null;
  const digest = image.slice(at + 1);
  return digest.startsWith("sha256:") ? digest : null;
};

type FractalServiceItem = {
  status?: {
    currentImage?: string;
    deploymentHistory?: { image?: string }[];
  };
};

/**
 * Manifest digests referenced by any FractalService: the currently deployed
 * image plus every rollback-candidate in its deployment history. Read
 * cluster-wide via the in-cluster Kubernetes API using the pod's ServiceAccount.
 *
 * Returns `null` on ANY failure (missing in-cluster credentials, RBAC denied,
 * API error, timeout) so the caller FAILS SAFE and skips pruning rather than
 * pruning blind - protection must never degrade into deletion on a read error.
 */
export const getDeployedDigests = async (): Promise<Set<string> | null> => {
  const token = readServiceAccountFile("token");
  const ca = readServiceAccountFile("ca.crt");
  if (!token || !ca) return null;

  try {
    const response = await fetch(`${K8S_API}${FRACTALSERVICES_PATH}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
      // Bun reads `tls` to trust the in-cluster CA for this request
      tls: { ca },
    } as RequestInit & { tls: { ca: string } });

    if (!response.ok) return null;

    const body = (await response.json()) as { items?: FractalServiceItem[] };
    const digests = new Set<string>();
    for (const item of body.items ?? []) {
      const status = item.status ?? {};
      const refs = [
        status.currentImage,
        ...(status.deploymentHistory ?? []).map((entry) => entry.image),
      ];
      for (const ref of refs) {
        const digest = digestFromImageRef(ref);
        if (digest) digests.add(digest);
      }
    }
    return digests;
  } catch {
    return null;
  }
};
