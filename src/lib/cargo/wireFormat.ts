/**
 * Cargo publish metadata extracted from the wire format.
 *
 * @see https://doc.rust-lang.org/cargo/reference/registry-web-api.html#publish
 */
export interface CargoPublishMetadata {
  name: string;
  vers: string;
  deps: CargoDependency[];
  features: Record<string, string[]>;
  cksum: string;
  links?: string | null;
  rust_version?: string | null;
  [key: string]: unknown;
}

export interface CargoDependency {
  name: string;
  version_req: string;
  features: string[];
  optional: boolean;
  default_features: boolean;
  target: string | null;
  kind: "normal" | "dev" | "build";
  registry: string | null;
}

interface ParsedPublishBody {
  metadata: CargoPublishMetadata;
  crateBytes: Uint8Array;
}

/**
 * Parse Cargo's binary publish body.
 *
 * Wire format:
 * - 4 bytes: metadata JSON length (LE u32)
 * - N bytes: metadata JSON
 * - 4 bytes: .crate tarball length (LE u32)
 * - M bytes: .crate tarball
 */
export const parsePublishBody = (body: ArrayBuffer): ParsedPublishBody => {
  const view = new DataView(body);

  if (body.byteLength < 4) {
    throw new Error("publish body too short: missing metadata length");
  }

  const metaLen = view.getUint32(0, true);

  if (body.byteLength < 4 + metaLen + 4) {
    throw new Error(
      "publish body too short: truncated metadata or missing crate length",
    );
  }

  const metaBytes = new Uint8Array(body, 4, metaLen);
  const metaJson = new TextDecoder().decode(metaBytes);
  const metadata: CargoPublishMetadata = JSON.parse(metaJson);

  const crateLen = view.getUint32(4 + metaLen, true);

  if (body.byteLength < 4 + metaLen + 4 + crateLen) {
    throw new Error("publish body too short: truncated crate data");
  }

  const crateBytes = new Uint8Array(body, 4 + metaLen + 4, crateLen);

  return { metadata, crateBytes };
};
