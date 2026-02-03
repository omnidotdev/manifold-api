/**
 * OCI Distribution API error types.
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md#error-codes
 */

interface OciErrorDetail {
  code: string;
  message: string;
  detail?: unknown;
}

interface OciErrorResponse {
  errors: OciErrorDetail[];
}

export const createOciError = (
  code: string,
  message: string,
  detail?: unknown,
): OciErrorResponse => ({
  errors: [{ code, message, detail }],
});

export const nameUnknown = (name: string): OciErrorResponse =>
  createOciError("NAME_UNKNOWN", `repository name not known: ${name}`);

export const blobUnknown = (digest: string): OciErrorResponse =>
  createOciError("BLOB_UNKNOWN", `blob unknown: ${digest}`);

export const manifestUnknown = (reference: string): OciErrorResponse =>
  createOciError("MANIFEST_UNKNOWN", `manifest unknown: ${reference}`);

export const digestInvalid = (
  expected: string,
  actual: string,
): OciErrorResponse =>
  createOciError("DIGEST_INVALID", `digest mismatch: expected ${expected}, got ${actual}`);

export const unsupported = (message: string): OciErrorResponse =>
  createOciError("UNSUPPORTED", message);
