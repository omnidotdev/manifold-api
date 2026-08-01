import { describe, expect, test } from "bun:test";

import { parsePublishBody, toCargoIndexDependency } from "lib/cargo/wireFormat";

describe("parsePublishBody", () => {
  const buildBody = (
    metadata: object,
    crateBytes: Uint8Array,
  ): ArrayBuffer => {
    const metaJson = JSON.stringify(metadata);
    const metaBytes = new TextEncoder().encode(metaJson);
    const buf = new ArrayBuffer(4 + metaBytes.length + 4 + crateBytes.length);
    const view = new DataView(buf);
    const u8 = new Uint8Array(buf);

    view.setUint32(0, metaBytes.length, true);
    u8.set(metaBytes, 4);
    view.setUint32(4 + metaBytes.length, crateBytes.length, true);
    u8.set(crateBytes, 4 + metaBytes.length + 4);

    return buf;
  };

  test("parses valid publish body", () => {
    const meta = {
      name: "foo",
      vers: "0.1.0",
      deps: [],
      features: {},
      cksum: "abc123",
    };
    const crateData = new Uint8Array([1, 2, 3, 4]);
    const body = buildBody(meta, crateData);

    const result = parsePublishBody(body);

    expect(result.metadata.name).toBe("foo");
    expect(result.metadata.vers).toBe("0.1.0");
    expect(result.crateBytes.length).toBe(4);
  });

  test("rejects truncated body", () => {
    expect(() => parsePublishBody(new ArrayBuffer(2))).toThrow();
  });
});

describe("toCargoIndexDependency", () => {
  const base = {
    name: "serde",
    version_req: "^1.0",
    features: ["derive"],
    optional: false,
    default_features: true,
    target: null,
    kind: "normal" as const,
    registry: null,
  };

  test("renames version_req to req", () => {
    const out = toCargoIndexDependency(base);
    expect(out.req).toBe("^1.0");
    expect("version_req" in out).toBe(false);
  });

  test("preserves the other dependency fields", () => {
    const out = toCargoIndexDependency(base);
    expect(out).toEqual({
      name: "serde",
      req: "^1.0",
      features: ["derive"],
      optional: false,
      default_features: true,
      target: null,
      kind: "normal",
      registry: null,
    });
  });

  test("maps explicit_name_in_toml to package for a renamed dependency", () => {
    const out = toCargoIndexDependency({
      ...base,
      name: "renamed",
      explicit_name_in_toml: "original",
    });
    expect(out.package).toBe("original");
  });

  test("omits package when the dependency is not renamed", () => {
    expect("package" in toCargoIndexDependency(base)).toBe(false);
  });
});
