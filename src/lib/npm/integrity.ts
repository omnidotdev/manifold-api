interface Integrity {
  /** Hex sha1 (npm `dist.shasum`) */
  shasum: string;
  /** SRI `sha512-<base64>` (npm `dist.integrity`) */
  integrity: string;
}

/** Compute npm's legacy shasum (sha1 hex) and SRI integrity (sha512 base64). */
export const computeIntegrity = (bytes: Uint8Array): Integrity => {
  const sha1 = new Bun.CryptoHasher("sha1");
  sha1.update(bytes);
  const sha512 = new Bun.CryptoHasher("sha512");
  sha512.update(bytes);
  return {
    shasum: sha1.digest("hex"),
    integrity: `sha512-${sha512.digest("base64")}`,
  };
};
