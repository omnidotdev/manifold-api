/**
 * Compute SHA256 digest of content.
 * @param content - Content to hash
 * @returns Digest in format "sha256:<hex>"
 */
export const computeDigest = async (
  content: ArrayBuffer | Uint8Array,
): Promise<string> => {
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(content);
  const hex = hash.digest("hex");
  return `sha256:${hex}`;
};
