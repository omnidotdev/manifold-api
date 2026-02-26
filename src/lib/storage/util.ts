/**
 * Parse a digest string into algorithm and hash components.
 * @param digest - Content-addressed digest (e.g. "sha256:abcdef...")
 * @returns Parsed algorithm and hash
 */
const parseDigest = (digest: string): { algorithm: string; hash: string } => {
  const colonIdx = digest.indexOf(":");
  if (colonIdx === -1) {
    throw new Error(`Invalid digest format: ${digest}`);
  }

  const algorithm = digest.slice(0, colonIdx);
  const hash = digest.slice(colonIdx + 1);

  if (!/^[a-f0-9]+$/.test(hash)) {
    throw new Error(`Invalid digest hash: ${hash}`);
  }

  return { algorithm, hash };
};

export { parseDigest };
