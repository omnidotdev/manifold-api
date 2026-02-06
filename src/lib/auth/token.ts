import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "mf_";
const TOKEN_BYTE_LENGTH = 32; // 256 bits of entropy

/**
 * Generated token with plaintext, hash, and prefix.
 */
export interface GeneratedToken {
  /** Plaintext token to give to user (show once) */
  plaintext: string;
  /** SHA-256 hash for database storage */
  hash: string;
  /** First 11 chars for identification (mf_ + 8) */
  prefix: string;
}

/**
 * Generate a new API token.
 *
 * @returns Token data with plaintext, hash, and prefix
 */
export const generateApiToken = (): GeneratedToken => {
  const bytes = randomBytes(TOKEN_BYTE_LENGTH);
  const encoded = bytes.toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${encoded}`;

  return {
    plaintext,
    hash: hashToken(plaintext),
    prefix: plaintext.slice(0, 11),
  };
};

/**
 * Hash a token for storage/comparison.
 *
 * @param token - Plaintext token
 * @returns SHA-256 hex hash
 */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/**
 * Validate token format.
 *
 * @param token - Token to validate
 * @returns true if format is valid (mf_ prefix + 43 base64url chars)
 */
export const isValidTokenFormat = (token: string): boolean =>
  /^mf_[A-Za-z0-9_-]{43}$/.test(token);

/**
 * Extract prefix from token for identification.
 *
 * @param token - Plaintext token
 * @returns First 11 chars (mf_ + 8)
 */
export const extractTokenPrefix = (token: string): string => token.slice(0, 11);
