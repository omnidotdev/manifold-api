import { describe, expect, test } from "bun:test";

import { splitCargoFeatures } from "lib/cargo/features";

describe("splitCargoFeatures", () => {
  test("keeps plain features in `features` with empty `features2`", () => {
    const { features, features2 } = splitCargoFeatures({
      default: ["std"],
      std: [],
    });
    expect(features).toEqual({ default: ["std"], std: [] });
    expect(features2).toEqual({});
  });

  test("moves namespaced `dep:` features into `features2`", () => {
    const { features, features2 } = splitCargoFeatures({
      default: ["onnx"],
      onnx: ["dep:ort", "dep:ndarray"],
    });
    // `default` references a feature name, so it stays plain
    expect(features).toEqual({ default: ["onnx"] });
    expect(features2).toEqual({ onnx: ["dep:ort", "dep:ndarray"] });
  });

  test("moves weak dependency (`?/`) features into `features2`", () => {
    const { features, features2 } = splitCargoFeatures({
      serde: ["dep:serde"],
      derive: ["serde?/derive"],
      plain: ["other"],
    });
    expect(features).toEqual({ plain: ["other"] });
    expect(features2).toEqual({
      serde: ["dep:serde"],
      derive: ["serde?/derive"],
    });
  });

  test("handles null/undefined/empty input", () => {
    expect(splitCargoFeatures(null)).toEqual({ features: {}, features2: {} });
    expect(splitCargoFeatures(undefined)).toEqual({
      features: {},
      features2: {},
    });
    expect(splitCargoFeatures({})).toEqual({ features: {}, features2: {} });
  });
});
