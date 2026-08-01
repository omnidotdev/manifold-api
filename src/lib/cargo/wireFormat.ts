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
  /** Original crate name when the dependency is renamed in Cargo.toml. */
  explicit_name_in_toml?: string;
}

/** A dependency as it appears in the Cargo sparse index (not the publish body). */
export interface CargoIndexDependency {
  name: string;
  req: string;
  features: string[];
  optional: boolean;
  default_features: boolean;
  target: string | null;
  kind: "normal" | "dev" | "build";
  registry: string | null;
  package?: string;
}

/**
 * Convert a publish-payload dependency to its Cargo index shape.
 *
 * The index format names the version requirement `req`, while the publish body
 * uses `version_req`; a renamed dependency's original name moves from
 * `explicit_name_in_toml` to `package`. Serving the publish shape verbatim makes
 * Cargo reject the whole index entry, since `req` is a required field.
 *
 * @see https://doc.rust-lang.org/cargo/reference/registry-index.html#json-schema
 */
export const toCargoIndexDependency = (
  dep: CargoDependency,
): CargoIndexDependency => ({
  name: dep.name,
  req: dep.version_req,
  features: dep.features,
  optional: dep.optional,
  default_features: dep.default_features,
  target: dep.target,
  kind: dep.kind,
  registry: dep.registry,
  ...(dep.explicit_name_in_toml !== undefined
    ? { package: dep.explicit_name_in_toml }
    : {}),
});

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
