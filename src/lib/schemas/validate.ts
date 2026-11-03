import { buildSchema } from "graphql";

/**
 * Supported schema formats. A repository's `artifactType` is set to one of
 * these so the registry can browse and validate per format.
 */
export const SCHEMA_FORMATS = ["openapi", "graphql", "jsonschema"] as const;

export type SchemaFormat = (typeof SCHEMA_FORMATS)[number];

export const isSchemaFormat = (value: string): value is SchemaFormat =>
  (SCHEMA_FORMATS as readonly string[]).includes(value);

/** Media type stored on the artifact per format */
export const SCHEMA_MEDIA_TYPES: Record<SchemaFormat, string> = {
  openapi: "application/vnd.oai.openapi+json",
  graphql: "application/graphql",
  jsonschema: "application/schema+json",
};

interface SchemaValidation {
  isValid: boolean;
  validationErrors: string[];
  title: string | null;
  version: string | null;
}

/**
 * Validate a schema document for the given format. Returns validity plus any
 * errors and extracted title/version; the document is always stored regardless
 * of validity so invalid schemas remain inspectable with their errors.
 */
export const validateSchema = (
  format: SchemaFormat,
  content: string,
): SchemaValidation => {
  if (format === "graphql") {
    try {
      buildSchema(content);
      return {
        isValid: true,
        validationErrors: [],
        title: null,
        version: null,
      };
    } catch (e) {
      return {
        isValid: false,
        validationErrors: [(e as Error).message],
        title: null,
        version: null,
      };
    }
  }

  // openapi + jsonschema are JSON documents
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(content);
  } catch (e) {
    return {
      isValid: false,
      validationErrors: [`invalid JSON: ${(e as Error).message}`],
      title: null,
      version: null,
    };
  }

  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
    return {
      isValid: false,
      validationErrors: [`${format} document must be a JSON object`],
      title: null,
      version: null,
    };
  }

  if (format === "openapi") {
    const errors: string[] = [];
    const ver =
      typeof doc.openapi === "string"
        ? doc.openapi
        : typeof doc.swagger === "string"
          ? doc.swagger
          : null;
    if (!ver) errors.push("missing `openapi` or `swagger` version field");
    const info = doc.info as { title?: string; version?: string } | undefined;
    if (!info || typeof info !== "object") errors.push("missing `info` object");
    if (!doc.paths || typeof doc.paths !== "object") {
      errors.push("missing `paths` object");
    }
    return {
      isValid: errors.length === 0,
      validationErrors: errors,
      title: info?.title ?? null,
      version: info?.version ?? null,
    };
  }

  // jsonschema: a valid JSON object is accepted; surface $id/title when present
  const title = typeof doc.title === "string" ? doc.title : null;
  const id = typeof doc.$id === "string" ? doc.$id : null;
  return { isValid: true, validationErrors: [], title, version: id };
};
