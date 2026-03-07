// @ts-nocheck
/* eslint-disable graphile-export/export-instances, graphile-export/export-methods, graphile-export/export-plans, graphile-export/exhaustive-deps */
import { PgCondition, PgDeleteSingleStep, PgExecutor, TYPES, assertPgClassSingleStep, listOfCodec, makeRegistry, pgDeleteSingle, pgInsertSingle, pgSelectFromRecord, pgUpdateSingle, recordCodec, sqlValueWithCodec } from "@dataplan/pg";
import { ConnectionStep, EdgeStep, ObjectStep, __ValueStep, access, assertExecutableStep, bakedInputRuntime, connection, constant, context, createObjectAndApplyChildren, first, get as get2, inhibitOnNull, inspect, lambda, list, makeDecodeNodeId, makeGrafastSchema, object, rootValue, specFromNodeId } from "grafast";
import { GraphQLError, Kind } from "graphql";
import { sql } from "pg-sql2";
const nodeIdHandler_Query = {
  typeName: "Query",
  codec: {
    name: "raw",
    encode: Object.assign(function rawEncode(value) {
      return typeof value === "string" ? value : null;
    }, {
      isSyncAndSafe: true
    }),
    decode: Object.assign(function rawDecode(value) {
      return typeof value === "string" ? value : null;
    }, {
      isSyncAndSafe: true
    })
  },
  match(specifier) {
    return specifier === "query";
  },
  getIdentifiers(_value) {
    return [];
  },
  getSpec() {
    return "irrelevant";
  },
  get() {
    return rootValue();
  },
  plan() {
    return constant`query`;
  }
};
const nodeIdCodecs_base64JSON_base64JSON = {
  name: "base64JSON",
  encode: (() => {
    function base64JSONEncode(value) {
      return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
    }
    base64JSONEncode.isSyncAndSafe = !0;
    return base64JSONEncode;
  })(),
  decode: (() => {
    function base64JSONDecode(value) {
      return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    }
    base64JSONDecode.isSyncAndSafe = !0;
    return base64JSONDecode;
  })()
};
const nodeIdCodecs = {
  __proto__: null,
  raw: nodeIdHandler_Query.codec,
  base64JSON: nodeIdCodecs_base64JSON_base64JSON,
  pipeString: {
    name: "pipeString",
    encode: Object.assign(function pipeStringEncode(value) {
      return Array.isArray(value) ? value.join("|") : null;
    }, {
      isSyncAndSafe: true
    }),
    decode: Object.assign(function pipeStringDecode(value) {
      return typeof value === "string" ? value.split("|") : null;
    }, {
      isSyncAndSafe: true
    })
  }
};
const executor = new PgExecutor({
  name: "main",
  context() {
    const ctx = context();
    return object({
      pgSettings: "pgSettings" != null ? ctx.get("pgSettings") : constant(null),
      withPgClient: ctx.get("withPgClient")
    });
  }
});
const containerMetadataIdentifier = sql.identifier("public", "container_metadata");
const spec_containerMetadata = {
  name: "containerMetadata",
  identifier: containerMetadataIdentifier,
  attributes: {
    __proto__: null,
    artifact_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    schema_version: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    architecture: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    os: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    config_digest: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    layer_digests: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376534",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "container_metadata"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const containerMetadataCodec = recordCodec(spec_containerMetadata);
const wasmMetadataIdentifier = sql.identifier("public", "wasm_metadata");
const spec_wasmMetadata = {
  name: "wasmMetadata",
  identifier: wasmMetadataIdentifier,
  attributes: {
    __proto__: null,
    artifact_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    runtime: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    exports: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    imports: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376611",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "wasm_metadata"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const wasmMetadataCodec = recordCodec(spec_wasmMetadata);
const tagIdentifier = sql.identifier("public", "tag");
const spec_tag = {
  name: "tag",
  identifier: tagIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    repository_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    artifact_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376585",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "tag"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const tagCodec = recordCodec(spec_tag);
const uploadSessionIdentifier = sql.identifier("public", "upload_session");
const spec_uploadSession = {
  name: "uploadSession",
  identifier: uploadSessionIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    repository_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    offset: {
      description: undefined,
      codec: TYPES.bigint,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    expires_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376599",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "upload_session"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const uploadSessionCodec = recordCodec(spec_uploadSession);
const artifactIdentifier = sql.identifier("public", "artifact");
const spec_artifact = {
  name: "artifact",
  identifier: artifactIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    repository_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    digest: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    size: {
      description: undefined,
      codec: TYPES.bigint,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    media_type: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    content: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    storage_path: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376520",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "artifact"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const artifactCodec = recordCodec(spec_artifact);
const schemaMetadataIdentifier = sql.identifier("public", "schema_metadata");
const spec_schemaMetadata = {
  name: "schemaMetadata",
  identifier: schemaMetadataIdentifier,
  attributes: {
    __proto__: null,
    artifact_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    version: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    title: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    is_valid: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    validation_errors: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376575",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "schema_metadata"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const schemaMetadataCodec = recordCodec(spec_schemaMetadata);
const namespaceIdentifier = sql.identifier("public", "namespace");
const spec_namespace = {
  name: "namespace",
  identifier: namespaceIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    organization_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376545",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "namespace"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const namespaceCodec = recordCodec(spec_namespace);
const repositoryIdentifier = sql.identifier("public", "repository");
const spec_repository = {
  name: "repository",
  identifier: repositoryIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    namespace_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    artifact_type: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    is_public: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376559",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "repository"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const repositoryCodec = recordCodec(spec_repository);
const federatedSourceIdentifier = sql.identifier("public", "federated_source");
const spec_federatedSource = {
  name: "federatedSource",
  identifier: federatedSourceIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    namespace: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    upstream_base_url: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    upstream_type: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    enabled: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    rate_limit_rpm: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    cache_ttl_seconds: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    tag_list_cache_ttl_seconds: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    require_vetting: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "445316",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "federated_source"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const federatedSourceCodec = recordCodec(spec_federatedSource);
const federatedSkillCacheIdentifier = sql.identifier("public", "federated_skill_cache");
const spec_federatedSkillCache = {
  name: "federatedSkillCache",
  identifier: federatedSkillCacheIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    source_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    slug: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    content: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    content_digest: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    fetched_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    expires_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    vet_status: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    vet_reason: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    vetted_by: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    vetted_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    upstream_meta: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "445302",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "federated_skill_cache"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const federatedSkillCacheCodec = recordCodec(spec_federatedSkillCache);
const apiTokenIdentifier = sql.identifier("public", "api_token");
const spec_apiToken = {
  name: "apiToken",
  identifier: apiTokenIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    token_hash: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    token_prefix: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    namespace_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    repository_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    scope: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_by: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    is_active: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    expires_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    last_used_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "376809",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "api_token"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const apiTokenCodec = recordCodec(spec_apiToken);
const cargoMetadataIdentifier = sql.identifier("public", "cargo_metadata");
const spec_cargoMetadata = {
  name: "cargoMetadata",
  identifier: cargoMetadataIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    artifact_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    vers: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    deps: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    features: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    cksum: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    yanked: {
      description: undefined,
      codec: TYPES.boolean,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    links: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    rust_version: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    v: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "495542",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "cargo_metadata"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const cargoMetadataCodec = recordCodec(spec_cargoMetadata);
const container_metadataUniques = [{
  isPrimary: true,
  attributes: ["artifact_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_container_metadata_container_metadata = {
  executor: executor,
  name: "container_metadata",
  identifier: "main.public.container_metadata",
  from: containerMetadataIdentifier,
  codec: containerMetadataCodec,
  uniques: container_metadataUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "container_metadata"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const wasm_metadataUniques = [{
  isPrimary: true,
  attributes: ["artifact_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_wasm_metadata_wasm_metadata = {
  executor: executor,
  name: "wasm_metadata",
  identifier: "main.public.wasm_metadata",
  from: wasmMetadataIdentifier,
  codec: wasmMetadataCodec,
  uniques: wasm_metadataUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "wasm_metadata"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const tagUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_tag_tag = {
  executor: executor,
  name: "tag",
  identifier: "main.public.tag",
  from: tagIdentifier,
  codec: tagCodec,
  uniques: tagUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "tag"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const upload_sessionUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_upload_session_upload_session = {
  executor: executor,
  name: "upload_session",
  identifier: "main.public.upload_session",
  from: uploadSessionIdentifier,
  codec: uploadSessionCodec,
  uniques: upload_sessionUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "upload_session"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const artifactUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_artifact_artifact = {
  executor: executor,
  name: "artifact",
  identifier: "main.public.artifact",
  from: artifactIdentifier,
  codec: artifactCodec,
  uniques: artifactUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "artifact"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const schema_metadataUniques = [{
  isPrimary: true,
  attributes: ["artifact_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_schema_metadata_schema_metadata = {
  executor: executor,
  name: "schema_metadata",
  identifier: "main.public.schema_metadata",
  from: schemaMetadataIdentifier,
  codec: schemaMetadataCodec,
  uniques: schema_metadataUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "schema_metadata"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const namespaceUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}, {
  isPrimary: false,
  attributes: ["name"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_namespace_namespace = {
  executor: executor,
  name: "namespace",
  identifier: "main.public.namespace",
  from: namespaceIdentifier,
  codec: namespaceCodec,
  uniques: namespaceUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "namespace"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const repositoryUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_repository_repository = {
  executor: executor,
  name: "repository",
  identifier: "main.public.repository",
  from: repositoryIdentifier,
  codec: repositoryCodec,
  uniques: repositoryUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "repository"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const federated_sourceUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}, {
  isPrimary: false,
  attributes: ["namespace"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_federated_source_federated_source = {
  executor: executor,
  name: "federated_source",
  identifier: "main.public.federated_source",
  from: federatedSourceIdentifier,
  codec: federatedSourceCodec,
  uniques: federated_sourceUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "federated_source"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const federated_skill_cacheUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_federated_skill_cache_federated_skill_cache = {
  executor: executor,
  name: "federated_skill_cache",
  identifier: "main.public.federated_skill_cache",
  from: federatedSkillCacheIdentifier,
  codec: federatedSkillCacheCodec,
  uniques: federated_skill_cacheUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "federated_skill_cache"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const cargo_metadataUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_cargo_metadata_cargo_metadata = {
  executor: executor,
  name: "cargo_metadata",
  identifier: "main.public.cargo_metadata",
  from: cargoMetadataIdentifier,
  codec: cargoMetadataCodec,
  uniques: cargo_metadataUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "cargo_metadata"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const api_tokenUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_api_token_api_token = {
  executor: executor,
  name: "api_token",
  identifier: "main.public.api_token",
  from: apiTokenIdentifier,
  codec: apiTokenCodec,
  uniques: api_tokenUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "api_token"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const registryConfig = {
  pgExecutors: {
    __proto__: null,
    main: executor
  },
  pgCodecs: {
    __proto__: null,
    containerMetadata: containerMetadataCodec,
    uuid: TYPES.uuid,
    int4: TYPES.int,
    text: TYPES.text,
    jsonb: TYPES.jsonb,
    wasmMetadata: wasmMetadataCodec,
    tag: tagCodec,
    timestamptz: TYPES.timestamptz,
    uploadSession: uploadSessionCodec,
    int8: TYPES.bigint,
    artifact: artifactCodec,
    schemaMetadata: schemaMetadataCodec,
    bool: TYPES.boolean,
    namespace: namespaceCodec,
    repository: repositoryCodec,
    federatedSource: federatedSourceCodec,
    federatedSkillCache: federatedSkillCacheCodec,
    apiToken: apiTokenCodec,
    cargoMetadata: cargoMetadataCodec
  },
  pgResources: {
    __proto__: null,
    container_metadata: registryConfig_pgResources_container_metadata_container_metadata,
    wasm_metadata: registryConfig_pgResources_wasm_metadata_wasm_metadata,
    tag: registryConfig_pgResources_tag_tag,
    upload_session: registryConfig_pgResources_upload_session_upload_session,
    artifact: registryConfig_pgResources_artifact_artifact,
    schema_metadata: registryConfig_pgResources_schema_metadata_schema_metadata,
    namespace: registryConfig_pgResources_namespace_namespace,
    repository: registryConfig_pgResources_repository_repository,
    federated_source: registryConfig_pgResources_federated_source_federated_source,
    federated_skill_cache: registryConfig_pgResources_federated_skill_cache_federated_skill_cache,
    cargo_metadata: registryConfig_pgResources_cargo_metadata_cargo_metadata,
    api_token: registryConfig_pgResources_api_token_api_token
  },
  pgRelations: {
    __proto__: null,
    apiToken: {
      __proto__: null,
      namespaceByMyNamespaceId: {
        localCodec: apiTokenCodec,
        remoteResourceOptions: registryConfig_pgResources_namespace_namespace,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["namespace_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      repositoryByMyRepositoryId: {
        localCodec: apiTokenCodec,
        remoteResourceOptions: registryConfig_pgResources_repository_repository,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["repository_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    artifact: {
      __proto__: null,
      repositoryByMyRepositoryId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_repository_repository,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["repository_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      containerMetadataByTheirArtifactId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_container_metadata_container_metadata,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["artifact_id"],
        isUnique: true,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      schemaMetadataByTheirArtifactId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_schema_metadata_schema_metadata,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["artifact_id"],
        isUnique: true,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      tagsByTheirArtifactId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_tag_tag,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["artifact_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      wasmMetadataByTheirArtifactId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_wasm_metadata_wasm_metadata,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["artifact_id"],
        isUnique: true,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      cargoMetadataByTheirArtifactId: {
        localCodec: artifactCodec,
        remoteResourceOptions: registryConfig_pgResources_cargo_metadata_cargo_metadata,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["artifact_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    cargoMetadata: {
      __proto__: null,
      artifactByMyArtifactId: {
        localCodec: cargoMetadataCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["artifact_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    containerMetadata: {
      __proto__: null,
      artifactByMyArtifactId: {
        localCodec: containerMetadataCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["artifact_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    federatedSkillCache: {
      __proto__: null,
      federatedSourceByMySourceId: {
        localCodec: federatedSkillCacheCodec,
        remoteResourceOptions: registryConfig_pgResources_federated_source_federated_source,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["source_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    federatedSource: {
      __proto__: null,
      federatedSkillCachesByTheirSourceId: {
        localCodec: federatedSourceCodec,
        remoteResourceOptions: registryConfig_pgResources_federated_skill_cache_federated_skill_cache,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["source_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    namespace: {
      __proto__: null,
      repositoriesByTheirNamespaceId: {
        localCodec: namespaceCodec,
        remoteResourceOptions: registryConfig_pgResources_repository_repository,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["namespace_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      apiTokensByTheirNamespaceId: {
        localCodec: namespaceCodec,
        remoteResourceOptions: registryConfig_pgResources_api_token_api_token,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["namespace_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    repository: {
      __proto__: null,
      namespaceByMyNamespaceId: {
        localCodec: repositoryCodec,
        remoteResourceOptions: registryConfig_pgResources_namespace_namespace,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["namespace_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      artifactsByTheirRepositoryId: {
        localCodec: repositoryCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["repository_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      tagsByTheirRepositoryId: {
        localCodec: repositoryCodec,
        remoteResourceOptions: registryConfig_pgResources_tag_tag,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["repository_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      uploadSessionsByTheirRepositoryId: {
        localCodec: repositoryCodec,
        remoteResourceOptions: registryConfig_pgResources_upload_session_upload_session,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["repository_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      apiTokensByTheirRepositoryId: {
        localCodec: repositoryCodec,
        remoteResourceOptions: registryConfig_pgResources_api_token_api_token,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["repository_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    schemaMetadata: {
      __proto__: null,
      artifactByMyArtifactId: {
        localCodec: schemaMetadataCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["artifact_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    tag: {
      __proto__: null,
      artifactByMyArtifactId: {
        localCodec: tagCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["artifact_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      repositoryByMyRepositoryId: {
        localCodec: tagCodec,
        remoteResourceOptions: registryConfig_pgResources_repository_repository,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["repository_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    uploadSession: {
      __proto__: null,
      repositoryByMyRepositoryId: {
        localCodec: uploadSessionCodec,
        remoteResourceOptions: registryConfig_pgResources_repository_repository,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["repository_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    wasmMetadata: {
      __proto__: null,
      artifactByMyArtifactId: {
        localCodec: wasmMetadataCodec,
        remoteResourceOptions: registryConfig_pgResources_artifact_artifact,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["artifact_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    }
  }
};
const registry = makeRegistry(registryConfig);
const resource_container_metadataPgResource = registry.pgResources["container_metadata"];
const resource_wasm_metadataPgResource = registry.pgResources["wasm_metadata"];
const resource_tagPgResource = registry.pgResources["tag"];
const resource_upload_sessionPgResource = registry.pgResources["upload_session"];
const resource_artifactPgResource = registry.pgResources["artifact"];
const resource_schema_metadataPgResource = registry.pgResources["schema_metadata"];
const resource_namespacePgResource = registry.pgResources["namespace"];
const resource_repositoryPgResource = registry.pgResources["repository"];
const resource_federated_sourcePgResource = registry.pgResources["federated_source"];
const resource_federated_skill_cachePgResource = registry.pgResources["federated_skill_cache"];
const resource_cargo_metadataPgResource = registry.pgResources["cargo_metadata"];
const resource_api_tokenPgResource = registry.pgResources["api_token"];
const nodeIdHandler_ContainerMetadatum = {
  typeName: "ContainerMetadatum",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("ContainerMetadatum", false), $record.get("artifact_id")]);
  },
  getSpec($list) {
    return {
      artifact_id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_container_metadataPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "ContainerMetadatum";
  }
};
const specForHandlerCache = new Map();
function specForHandler(handler) {
  const existing = specForHandlerCache.get(handler);
  if (existing) return existing;
  function spec(nodeId) {
    if (nodeId == null) return null;
    try {
      const specifier = handler.codec.decode(nodeId);
      if (handler.match(specifier)) return specifier;
    } catch {}
    return null;
  }
  spec.displayName = `specifier_${handler.typeName}_${handler.codec.name}`;
  spec.isSyncAndSafe = !0;
  specForHandlerCache.set(handler, spec);
  return spec;
}
const nodeFetcher_ContainerMetadatum = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_ContainerMetadatum));
  return nodeIdHandler_ContainerMetadatum.get(nodeIdHandler_ContainerMetadatum.getSpec($decoded));
};
const nodeIdHandler_WasmMetadatum = {
  typeName: "WasmMetadatum",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("WasmMetadatum", false), $record.get("artifact_id")]);
  },
  getSpec($list) {
    return {
      artifact_id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_wasm_metadataPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "WasmMetadatum";
  }
};
const nodeFetcher_WasmMetadatum = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_WasmMetadatum));
  return nodeIdHandler_WasmMetadatum.get(nodeIdHandler_WasmMetadatum.getSpec($decoded));
};
const nodeIdHandler_Tag = {
  typeName: "Tag",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("Tag", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_tagPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "Tag";
  }
};
const nodeFetcher_Tag = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_Tag));
  return nodeIdHandler_Tag.get(nodeIdHandler_Tag.getSpec($decoded));
};
const nodeIdHandler_UploadSession = {
  typeName: "UploadSession",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("UploadSession", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_upload_sessionPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "UploadSession";
  }
};
const nodeFetcher_UploadSession = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_UploadSession));
  return nodeIdHandler_UploadSession.get(nodeIdHandler_UploadSession.getSpec($decoded));
};
const nodeIdHandler_Artifact = {
  typeName: "Artifact",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("Artifact", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_artifactPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "Artifact";
  }
};
const nodeFetcher_Artifact = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_Artifact));
  return nodeIdHandler_Artifact.get(nodeIdHandler_Artifact.getSpec($decoded));
};
const nodeIdHandler_SchemaMetadatum = {
  typeName: "SchemaMetadatum",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("SchemaMetadatum", false), $record.get("artifact_id")]);
  },
  getSpec($list) {
    return {
      artifact_id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_schema_metadataPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "SchemaMetadatum";
  }
};
const nodeFetcher_SchemaMetadatum = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_SchemaMetadatum));
  return nodeIdHandler_SchemaMetadatum.get(nodeIdHandler_SchemaMetadatum.getSpec($decoded));
};
const nodeIdHandler_Namespace = {
  typeName: "Namespace",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("Namespace", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_namespacePgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "Namespace";
  }
};
const nodeFetcher_Namespace = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_Namespace));
  return nodeIdHandler_Namespace.get(nodeIdHandler_Namespace.getSpec($decoded));
};
const nodeIdHandler_Repository = {
  typeName: "Repository",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("Repository", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_repositoryPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "Repository";
  }
};
const nodeFetcher_Repository = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_Repository));
  return nodeIdHandler_Repository.get(nodeIdHandler_Repository.getSpec($decoded));
};
const nodeIdHandler_FederatedSource = {
  typeName: "FederatedSource",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("FederatedSource", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_federated_sourcePgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "FederatedSource";
  }
};
const nodeFetcher_FederatedSource = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_FederatedSource));
  return nodeIdHandler_FederatedSource.get(nodeIdHandler_FederatedSource.getSpec($decoded));
};
const nodeIdHandler_FederatedSkillCache = {
  typeName: "FederatedSkillCache",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("FederatedSkillCache", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_federated_skill_cachePgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "FederatedSkillCache";
  }
};
const nodeFetcher_FederatedSkillCache = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_FederatedSkillCache));
  return nodeIdHandler_FederatedSkillCache.get(nodeIdHandler_FederatedSkillCache.getSpec($decoded));
};
const nodeIdHandler_CargoMetadatum = {
  typeName: "CargoMetadatum",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("CargoMetadatum", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_cargo_metadataPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "CargoMetadatum";
  }
};
const nodeFetcher_CargoMetadatum = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_CargoMetadatum));
  return nodeIdHandler_CargoMetadatum.get(nodeIdHandler_CargoMetadatum.getSpec($decoded));
};
const nodeIdHandler_ApiToken = {
  typeName: "ApiToken",
  codec: nodeIdCodecs_base64JSON_base64JSON,
  deprecationReason: undefined,
  plan($record) {
    return list([constant("ApiToken", false), $record.get("id")]);
  },
  getSpec($list) {
    return {
      id: inhibitOnNull(access($list, [1]))
    };
  },
  getIdentifiers(value) {
    return value.slice(1);
  },
  get(spec) {
    return resource_api_tokenPgResource.get(spec);
  },
  match(obj) {
    return obj[0] === "ApiToken";
  }
};
const nodeFetcher_ApiToken = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandler_ApiToken));
  return nodeIdHandler_ApiToken.get(nodeIdHandler_ApiToken.getSpec($decoded));
};
function qbWhereBuilder(qb) {
  return qb.whereBuilder();
}
function isEmpty(o) {
  return typeof o === "object" && o !== null && Object.keys(o).length === 0;
}
function assertAllowed(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed2(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed3(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed4(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed5(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed6(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed7(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed8(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed9(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed10(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed11(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed12(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const nodeIdHandlerByTypeName = {
  __proto__: null,
  Query: nodeIdHandler_Query,
  ContainerMetadatum: nodeIdHandler_ContainerMetadatum,
  WasmMetadatum: nodeIdHandler_WasmMetadatum,
  Tag: nodeIdHandler_Tag,
  UploadSession: nodeIdHandler_UploadSession,
  Artifact: nodeIdHandler_Artifact,
  SchemaMetadatum: nodeIdHandler_SchemaMetadatum,
  Namespace: nodeIdHandler_Namespace,
  Repository: nodeIdHandler_Repository,
  FederatedSource: nodeIdHandler_FederatedSource,
  FederatedSkillCache: nodeIdHandler_FederatedSkillCache,
  CargoMetadatum: nodeIdHandler_CargoMetadatum,
  ApiToken: nodeIdHandler_ApiToken
};
const decodeNodeId = makeDecodeNodeId(Object.values(nodeIdHandlerByTypeName));
function findTypeNameMatch(specifier) {
  if (!specifier) return null;
  for (const [typeName, typeSpec] of Object.entries(nodeIdHandlerByTypeName)) {
    const value = specifier[typeSpec.codec.name];
    if (value != null && typeSpec.match(value)) return typeName;
  }
  console.warn(`Could not find a type that matched the specifier '${inspect(specifier)}'`);
  return null;
}
function UUIDSerialize(value) {
  return "" + value;
}
const coerce = string => {
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(string)) throw new GraphQLError("Invalid UUID, expected 32 hexadecimal characters, optionally with hyphens");
  return string;
};
function assertAllowed13(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed14(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed15(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed16(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed17(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed18(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed19(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed20(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_repository.attributes.id
};
const colSpec2 = {
  fieldName: "namespaceId",
  attributeName: "namespace_id",
  attribute: spec_repository.attributes.namespace_id
};
const colSpec3 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_repository.attributes.name
};
const colSpec4 = {
  fieldName: "artifactType",
  attributeName: "artifact_type",
  attribute: spec_repository.attributes.artifact_type
};
function assertAllowed21(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed22(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed23(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const resolve = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec = () => TYPES.boolean;
const resolveSqlValue = () => sql.null;
const resolve2 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec2(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive.includes(resolveDomains(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive.includes(resolveDomains(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive.includes(resolveDomains(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive.includes(resolveDomains(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve3 = (i, v) => sql`${i} <> ${v}`;
const resolve4 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve5 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve6 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec3(c) {
  if (forceTextTypesSensitive.includes(resolveDomains(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve7 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve8 = (i, v) => sql`${i} < ${v}`;
const resolve9 = (i, v) => sql`${i} <= ${v}`;
const resolve10 = (i, v) => sql`${i} > ${v}`;
const resolve11 = (i, v) => sql`${i} >= ${v}`;
const resolve12 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec4 = () => TYPES.boolean;
const resolveSqlValue2 = () => sql.null;
const resolve13 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive2 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains2(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec5(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive2.includes(resolveDomains2(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier2(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive2.includes(resolveDomains2(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve14 = (i, v) => sql`${i} <> ${v}`;
const resolve15 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve16 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve17 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec6(c) {
  if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve18 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve19 = (i, v) => sql`${i} < ${v}`;
const resolve20 = (i, v) => sql`${i} <= ${v}`;
const resolve21 = (i, v) => sql`${i} > ${v}`;
const resolve22 = (i, v) => sql`${i} >= ${v}`;
const resolve23 = (i, v) => sql`${i} LIKE ${v}`;
function escapeLikeWildcards(input) {
  if (typeof input !== "string") throw Error("Non-string input was provided to escapeLikeWildcards");else return input.split("%").join("\\%").split("_").join("\\_");
}
const resolveInput = input => `%${escapeLikeWildcards(input)}%`;
const resolve24 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput2 = input => `%${escapeLikeWildcards(input)}%`;
const resolve25 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput3 = input => `%${escapeLikeWildcards(input)}%`;
const forceTextTypesInsensitive = [TYPES.char, TYPES.bpchar];
function resolveInputCodec7(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesInsensitive.includes(resolveDomains2(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesInsensitive.includes(resolveDomains2(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier3(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesInsensitive.includes(resolveDomains2(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesInsensitive.includes(resolveDomains2(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve26 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput4 = input => `%${escapeLikeWildcards(input)}%`;
const resolve27 = (i, v) => sql`${i} LIKE ${v}`;
const resolveInput5 = input => `${escapeLikeWildcards(input)}%`;
const resolve28 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput6 = input => `${escapeLikeWildcards(input)}%`;
const resolve29 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput7 = input => `${escapeLikeWildcards(input)}%`;
const resolve30 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput8 = input => `${escapeLikeWildcards(input)}%`;
const resolve31 = (i, v) => sql`${i} LIKE ${v}`;
const resolveInput9 = input => `%${escapeLikeWildcards(input)}`;
const resolve32 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput10 = input => `%${escapeLikeWildcards(input)}`;
const resolve33 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput11 = input => `%${escapeLikeWildcards(input)}`;
const resolve34 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput12 = input => `%${escapeLikeWildcards(input)}`;
const resolve35 = (i, v) => sql`${i} LIKE ${v}`;
const resolve36 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolve37 = (i, v) => sql`${i} ILIKE ${v}`;
const resolve38 = (i, v) => sql`${i} NOT ILIKE ${v}`;
function resolveInputCodec8(inputCodec) {
  if ("equalTo" === "in" || "equalTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier4(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue3(_unused, input, inputCodec) {
  if ("equalTo" === "in" || "equalTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec9(inputCodec) {
  if ("notEqualTo" === "in" || "notEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier5(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue4(_unused, input, inputCodec) {
  if ("notEqualTo" === "in" || "notEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec10(inputCodec) {
  if ("distinctFrom" === "in" || "distinctFrom" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier6(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue5(_unused, input, inputCodec) {
  if ("distinctFrom" === "in" || "distinctFrom" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec11(inputCodec) {
  if ("notDistinctFrom" === "in" || "notDistinctFrom" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier7(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue6(_unused, input, inputCodec) {
  if ("notDistinctFrom" === "in" || "notDistinctFrom" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec12(inputCodec) {
  if ("in" === "in" || "in" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier8(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue7(_unused, input, inputCodec) {
  if ("in" === "in" || "in" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec13(inputCodec) {
  if ("notIn" === "in" || "notIn" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier9(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue8(_unused, input, inputCodec) {
  if ("notIn" === "in" || "notIn" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec14(inputCodec) {
  if ("lessThan" === "in" || "lessThan" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier10(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue9(_unused, input, inputCodec) {
  if ("lessThan" === "in" || "lessThan" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec15(inputCodec) {
  if ("lessThanOrEqualTo" === "in" || "lessThanOrEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier11(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue10(_unused, input, inputCodec) {
  if ("lessThanOrEqualTo" === "in" || "lessThanOrEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec16(inputCodec) {
  if ("greaterThan" === "in" || "greaterThan" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier12(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue11(_unused, input, inputCodec) {
  if ("greaterThan" === "in" || "greaterThan" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec17(inputCodec) {
  if ("greaterThanOrEqualTo" === "in" || "greaterThanOrEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier13(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue12(_unused, input, inputCodec) {
  if ("greaterThanOrEqualTo" === "in" || "greaterThanOrEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function assertAllowed24(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec5 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_artifact.attributes.id
};
const colSpec6 = {
  fieldName: "repositoryId",
  attributeName: "repository_id",
  attribute: spec_artifact.attributes.repository_id
};
const colSpec7 = {
  fieldName: "digest",
  attributeName: "digest",
  attribute: spec_artifact.attributes.digest
};
function assertAllowed25(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed26(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed27(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec8 = {
  fieldName: "artifactId",
  attributeName: "artifact_id",
  attribute: spec_containerMetadata.attributes.artifact_id
};
function assertAllowed28(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed29(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec9 = {
  fieldName: "artifactId",
  attributeName: "artifact_id",
  attribute: spec_schemaMetadata.attributes.artifact_id
};
function assertAllowed30(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed31(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed32(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec10 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_tag.attributes.id
};
const colSpec11 = {
  fieldName: "repositoryId",
  attributeName: "repository_id",
  attribute: spec_tag.attributes.repository_id
};
const colSpec12 = {
  fieldName: "artifactId",
  attributeName: "artifact_id",
  attribute: spec_tag.attributes.artifact_id
};
const colSpec13 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_tag.attributes.name
};
function assertAllowed33(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed34(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec14 = {
  fieldName: "artifactId",
  attributeName: "artifact_id",
  attribute: spec_wasmMetadata.attributes.artifact_id
};
function assertAllowed35(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed36(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed37(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec15 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_cargoMetadata.attributes.id
};
const colSpec16 = {
  fieldName: "artifactId",
  attributeName: "artifact_id",
  attribute: spec_cargoMetadata.attributes.artifact_id
};
const colSpec17 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_cargoMetadata.attributes.name
};
const colSpec18 = {
  fieldName: "vers",
  attributeName: "vers",
  attribute: spec_cargoMetadata.attributes.vers
};
function assertAllowed38(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed39(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed40(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed41(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec19 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_uploadSession.attributes.id
};
const colSpec20 = {
  fieldName: "repositoryId",
  attributeName: "repository_id",
  attribute: spec_uploadSession.attributes.repository_id
};
const colSpec21 = {
  fieldName: "expiresAt",
  attributeName: "expires_at",
  attribute: spec_uploadSession.attributes.expires_at
};
function assertAllowed42(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed43(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const resolve39 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec18 = () => TYPES.boolean;
const resolveSqlValue13 = () => sql.null;
const resolve40 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive3 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains3(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec19(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive3.includes(resolveDomains3(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier14(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive3.includes(resolveDomains3(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve41 = (i, v) => sql`${i} <> ${v}`;
const resolve42 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve43 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve44 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec20(c) {
  if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve45 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve46 = (i, v) => sql`${i} < ${v}`;
const resolve47 = (i, v) => sql`${i} <= ${v}`;
const resolve48 = (i, v) => sql`${i} > ${v}`;
const resolve49 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed44(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec22 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_apiToken.attributes.id
};
const colSpec23 = {
  fieldName: "tokenHash",
  attributeName: "token_hash",
  attribute: spec_apiToken.attributes.token_hash
};
const colSpec24 = {
  fieldName: "tokenPrefix",
  attributeName: "token_prefix",
  attribute: spec_apiToken.attributes.token_prefix
};
const colSpec25 = {
  fieldName: "namespaceId",
  attributeName: "namespace_id",
  attribute: spec_apiToken.attributes.namespace_id
};
const colSpec26 = {
  fieldName: "repositoryId",
  attributeName: "repository_id",
  attribute: spec_apiToken.attributes.repository_id
};
const colSpec27 = {
  fieldName: "createdBy",
  attributeName: "created_by",
  attribute: spec_apiToken.attributes.created_by
};
const colSpec28 = {
  fieldName: "isActive",
  attributeName: "is_active",
  attribute: spec_apiToken.attributes.is_active
};
function assertAllowed45(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed46(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const resolve50 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec21 = () => TYPES.boolean;
const resolveSqlValue14 = () => sql.null;
const resolve51 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive4 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains4(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec22(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive4.includes(resolveDomains4(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier15(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive4.includes(resolveDomains4(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve52 = (i, v) => sql`${i} <> ${v}`;
const resolve53 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve54 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve55 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec23(c) {
  if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve56 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve57 = (i, v) => sql`${i} < ${v}`;
const resolve58 = (i, v) => sql`${i} <= ${v}`;
const resolve59 = (i, v) => sql`${i} > ${v}`;
const resolve60 = (i, v) => sql`${i} >= ${v}`;
const colSpec29 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_namespace.attributes.id
};
const colSpec30 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_namespace.attributes.name
};
const colSpec31 = {
  fieldName: "organizationId",
  attributeName: "organization_id",
  attribute: spec_namespace.attributes.organization_id
};
function assertAllowed47(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed48(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed49(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed50(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed51(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec32 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_federatedSkillCache.attributes.id
};
const colSpec33 = {
  fieldName: "sourceId",
  attributeName: "source_id",
  attribute: spec_federatedSkillCache.attributes.source_id
};
const colSpec34 = {
  fieldName: "slug",
  attributeName: "slug",
  attribute: spec_federatedSkillCache.attributes.slug
};
const colSpec35 = {
  fieldName: "expiresAt",
  attributeName: "expires_at",
  attribute: spec_federatedSkillCache.attributes.expires_at
};
const colSpec36 = {
  fieldName: "vetStatus",
  attributeName: "vet_status",
  attribute: spec_federatedSkillCache.attributes.vet_status
};
function assertAllowed52(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed53(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec37 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_federatedSource.attributes.id
};
const colSpec38 = {
  fieldName: "namespace",
  attributeName: "namespace",
  attribute: spec_federatedSource.attributes.namespace
};
const colSpec39 = {
  fieldName: "upstreamType",
  attributeName: "upstream_type",
  attribute: spec_federatedSource.attributes.upstream_type
};
function assertAllowed54(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed55(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed56(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
}
const specFromArgs_ContainerMetadatum = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_ContainerMetadatum, $nodeId);
};
const specFromArgs_WasmMetadatum = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_WasmMetadatum, $nodeId);
};
const specFromArgs_Tag = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Tag, $nodeId);
};
const specFromArgs_UploadSession = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_UploadSession, $nodeId);
};
const specFromArgs_Artifact = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Artifact, $nodeId);
};
const specFromArgs_SchemaMetadatum = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_SchemaMetadatum, $nodeId);
};
const specFromArgs_Namespace = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Namespace, $nodeId);
};
const specFromArgs_Repository = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Repository, $nodeId);
};
const specFromArgs_FederatedSource = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_FederatedSource, $nodeId);
};
const specFromArgs_FederatedSkillCache = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_FederatedSkillCache, $nodeId);
};
const specFromArgs_CargoMetadatum = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_CargoMetadatum, $nodeId);
};
const specFromArgs_ApiToken = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_ApiToken, $nodeId);
};
const specFromArgs_ContainerMetadatum2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_ContainerMetadatum, $nodeId);
};
const specFromArgs_WasmMetadatum2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_WasmMetadatum, $nodeId);
};
const specFromArgs_Tag2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Tag, $nodeId);
};
const specFromArgs_UploadSession2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_UploadSession, $nodeId);
};
const specFromArgs_Artifact2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Artifact, $nodeId);
};
const specFromArgs_SchemaMetadatum2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_SchemaMetadatum, $nodeId);
};
const specFromArgs_Namespace2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Namespace, $nodeId);
};
const specFromArgs_Repository2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_Repository, $nodeId);
};
const specFromArgs_FederatedSource2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_FederatedSource, $nodeId);
};
const specFromArgs_FederatedSkillCache2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_FederatedSkillCache, $nodeId);
};
const specFromArgs_CargoMetadatum2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_CargoMetadatum, $nodeId);
};
const specFromArgs_ApiToken2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandler_ApiToken, $nodeId);
};
const getPgSelectSingleFromMutationResult = (resource, pkAttributes, $mutation) => {
  const $result = $mutation.getStepForKey("result", !0);
  if (!$result) return null;
  if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
    const spec = pkAttributes.reduce((memo, attributeName) => {
      memo[attributeName] = $result.get(attributeName);
      return memo;
    }, Object.create(null));
    return resource.find(spec);
  }
};
const pgMutationPayloadEdge = (resource, pkAttributes, $mutation, fieldArgs) => {
  const $select = getPgSelectSingleFromMutationResult(resource, pkAttributes, $mutation);
  if (!$select) return constant(null);
  fieldArgs.apply($select, "orderBy");
  const $connection = connection($select);
  return new EdgeStep($connection, first($connection));
};
export const typeDefs = /* GraphQL */`"""The root query type which gives access points into the data universe."""
type Query implements Node {
  """
  Exposes the root query type nested one level down. This is helpful for Relay 1
  which can only query top level fields if they are in a particular form.
  """
  query: Query!

  """
  The root query type must be a \`Node\` to work well with Relay 1 mutations. This just resolves to \`query\`.
  """
  id: ID!

  """Fetches an object given its globally unique \`ID\`."""
  node(
    """The globally unique \`ID\`."""
    id: ID!
  ): Node

  """Get a single \`ContainerMetadatum\`."""
  containerMetadatum(artifactId: UUID!): ContainerMetadatum

  """Get a single \`WasmMetadatum\`."""
  wasmMetadatum(artifactId: UUID!): WasmMetadatum

  """Get a single \`Tag\`."""
  tag(rowId: UUID!): Tag

  """Get a single \`UploadSession\`."""
  uploadSession(rowId: UUID!): UploadSession

  """Get a single \`Artifact\`."""
  artifact(rowId: UUID!): Artifact

  """Get a single \`SchemaMetadatum\`."""
  schemaMetadatum(artifactId: UUID!): SchemaMetadatum

  """Get a single \`Namespace\`."""
  namespace(rowId: UUID!): Namespace

  """Get a single \`Namespace\`."""
  namespaceByName(name: String!): Namespace

  """Get a single \`Repository\`."""
  repository(rowId: UUID!): Repository

  """Get a single \`FederatedSource\`."""
  federatedSource(rowId: UUID!): FederatedSource

  """Get a single \`FederatedSource\`."""
  federatedSourceByNamespace(namespace: String!): FederatedSource

  """Get a single \`FederatedSkillCache\`."""
  federatedSkillCache(rowId: UUID!): FederatedSkillCache

  """Get a single \`CargoMetadatum\`."""
  cargoMetadatum(rowId: UUID!): CargoMetadatum

  """Get a single \`ApiToken\`."""
  apiToken(rowId: UUID!): ApiToken

  """Reads a single \`ContainerMetadatum\` using its globally unique \`ID\`."""
  containerMetadatumById(
    """
    The globally unique \`ID\` to be used in selecting a single \`ContainerMetadatum\`.
    """
    id: ID!
  ): ContainerMetadatum

  """Reads a single \`WasmMetadatum\` using its globally unique \`ID\`."""
  wasmMetadatumById(
    """
    The globally unique \`ID\` to be used in selecting a single \`WasmMetadatum\`.
    """
    id: ID!
  ): WasmMetadatum

  """Reads a single \`Tag\` using its globally unique \`ID\`."""
  tagById(
    """The globally unique \`ID\` to be used in selecting a single \`Tag\`."""
    id: ID!
  ): Tag

  """Reads a single \`UploadSession\` using its globally unique \`ID\`."""
  uploadSessionById(
    """
    The globally unique \`ID\` to be used in selecting a single \`UploadSession\`.
    """
    id: ID!
  ): UploadSession

  """Reads a single \`Artifact\` using its globally unique \`ID\`."""
  artifactById(
    """The globally unique \`ID\` to be used in selecting a single \`Artifact\`."""
    id: ID!
  ): Artifact

  """Reads a single \`SchemaMetadatum\` using its globally unique \`ID\`."""
  schemaMetadatumById(
    """
    The globally unique \`ID\` to be used in selecting a single \`SchemaMetadatum\`.
    """
    id: ID!
  ): SchemaMetadatum

  """Reads a single \`Namespace\` using its globally unique \`ID\`."""
  namespaceById(
    """The globally unique \`ID\` to be used in selecting a single \`Namespace\`."""
    id: ID!
  ): Namespace

  """Reads a single \`Repository\` using its globally unique \`ID\`."""
  repositoryById(
    """
    The globally unique \`ID\` to be used in selecting a single \`Repository\`.
    """
    id: ID!
  ): Repository

  """Reads a single \`FederatedSource\` using its globally unique \`ID\`."""
  federatedSourceById(
    """
    The globally unique \`ID\` to be used in selecting a single \`FederatedSource\`.
    """
    id: ID!
  ): FederatedSource

  """Reads a single \`FederatedSkillCache\` using its globally unique \`ID\`."""
  federatedSkillCacheById(
    """
    The globally unique \`ID\` to be used in selecting a single \`FederatedSkillCache\`.
    """
    id: ID!
  ): FederatedSkillCache

  """Reads a single \`CargoMetadatum\` using its globally unique \`ID\`."""
  cargoMetadatumById(
    """
    The globally unique \`ID\` to be used in selecting a single \`CargoMetadatum\`.
    """
    id: ID!
  ): CargoMetadatum

  """Reads a single \`ApiToken\` using its globally unique \`ID\`."""
  apiTokenById(
    """The globally unique \`ID\` to be used in selecting a single \`ApiToken\`."""
    id: ID!
  ): ApiToken

  """Reads and enables pagination through a set of \`ContainerMetadatum\`."""
  containerMetadata(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ContainerMetadatumCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ContainerMetadatumFilter

    """The method to use when ordering \`ContainerMetadatum\`."""
    orderBy: [ContainerMetadatumOrderBy!] = [PRIMARY_KEY_ASC]
  ): ContainerMetadatumConnection

  """Reads and enables pagination through a set of \`WasmMetadatum\`."""
  wasmMetadata(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: WasmMetadatumCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: WasmMetadatumFilter

    """The method to use when ordering \`WasmMetadatum\`."""
    orderBy: [WasmMetadatumOrderBy!] = [PRIMARY_KEY_ASC]
  ): WasmMetadatumConnection

  """Reads and enables pagination through a set of \`Tag\`."""
  tags(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TagCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TagFilter

    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!] = [PRIMARY_KEY_ASC]
  ): TagConnection

  """Reads and enables pagination through a set of \`UploadSession\`."""
  uploadSessions(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: UploadSessionCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: UploadSessionFilter

    """The method to use when ordering \`UploadSession\`."""
    orderBy: [UploadSessionOrderBy!] = [PRIMARY_KEY_ASC]
  ): UploadSessionConnection

  """Reads and enables pagination through a set of \`Artifact\`."""
  artifacts(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ArtifactCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ArtifactFilter

    """The method to use when ordering \`Artifact\`."""
    orderBy: [ArtifactOrderBy!] = [PRIMARY_KEY_ASC]
  ): ArtifactConnection

  """Reads and enables pagination through a set of \`SchemaMetadatum\`."""
  schemaMetadata(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: SchemaMetadatumCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: SchemaMetadatumFilter

    """The method to use when ordering \`SchemaMetadatum\`."""
    orderBy: [SchemaMetadatumOrderBy!] = [PRIMARY_KEY_ASC]
  ): SchemaMetadatumConnection

  """Reads and enables pagination through a set of \`Namespace\`."""
  namespaces(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: NamespaceCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: NamespaceFilter

    """The method to use when ordering \`Namespace\`."""
    orderBy: [NamespaceOrderBy!] = [PRIMARY_KEY_ASC]
  ): NamespaceConnection

  """Reads and enables pagination through a set of \`Repository\`."""
  repositories(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: RepositoryCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: RepositoryFilter

    """The method to use when ordering \`Repository\`."""
    orderBy: [RepositoryOrderBy!] = [PRIMARY_KEY_ASC]
  ): RepositoryConnection

  """Reads and enables pagination through a set of \`FederatedSource\`."""
  federatedSources(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: FederatedSourceCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: FederatedSourceFilter

    """The method to use when ordering \`FederatedSource\`."""
    orderBy: [FederatedSourceOrderBy!] = [PRIMARY_KEY_ASC]
  ): FederatedSourceConnection

  """Reads and enables pagination through a set of \`FederatedSkillCache\`."""
  federatedSkillCaches(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: FederatedSkillCacheCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: FederatedSkillCacheFilter

    """The method to use when ordering \`FederatedSkillCache\`."""
    orderBy: [FederatedSkillCacheOrderBy!] = [PRIMARY_KEY_ASC]
  ): FederatedSkillCacheConnection

  """Reads and enables pagination through a set of \`CargoMetadatum\`."""
  cargoMetadata(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: CargoMetadatumCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: CargoMetadatumFilter

    """The method to use when ordering \`CargoMetadatum\`."""
    orderBy: [CargoMetadatumOrderBy!] = [PRIMARY_KEY_ASC]
  ): CargoMetadatumConnection

  """Reads and enables pagination through a set of \`ApiToken\`."""
  apiTokens(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ApiTokenCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ApiTokenFilter

    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!] = [PRIMARY_KEY_ASC]
  ): ApiTokenConnection
}

"""An object with a globally unique \`ID\`."""
interface Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
}

type ContainerMetadatum implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  artifactId: UUID!
  schemaVersion: Int!
  architecture: String
  os: String
  configDigest: String
  layerDigests: JSON!

  """
  Reads a single \`Artifact\` that is related to this \`ContainerMetadatum\`.
  """
  artifact: Artifact
}

"""
A universally unique identifier as defined by [RFC 4122](https://tools.ietf.org/html/rfc4122).
"""
scalar UUID

"""
Represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
"""
scalar JSON

type Artifact implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  repositoryId: UUID!
  digest: String!
  size: BigInt!
  mediaType: String!
  content: String
  createdAt: Datetime
  storagePath: String

  """Reads a single \`Repository\` that is related to this \`Artifact\`."""
  repository: Repository

  """
  Reads a single \`ContainerMetadatum\` that is related to this \`Artifact\`.
  """
  containerMetadatum: ContainerMetadatum

  """Reads a single \`SchemaMetadatum\` that is related to this \`Artifact\`."""
  schemaMetadatum: SchemaMetadatum

  """Reads and enables pagination through a set of \`Tag\`."""
  tags(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TagCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TagFilter

    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!] = [PRIMARY_KEY_ASC]
  ): TagConnection!

  """Reads a single \`WasmMetadatum\` that is related to this \`Artifact\`."""
  wasmMetadatum: WasmMetadatum

  """Reads and enables pagination through a set of \`CargoMetadatum\`."""
  cargoMetadata(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: CargoMetadatumCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: CargoMetadatumFilter

    """The method to use when ordering \`CargoMetadatum\`."""
    orderBy: [CargoMetadatumOrderBy!] = [PRIMARY_KEY_ASC]
  ): CargoMetadatumConnection!
}

"""
A signed eight-byte integer. The upper big integer values are greater than the
max value for a JavaScript number. Therefore all big integers will be output as
strings and not numbers.
"""
scalar BigInt

"""
A point in time as described by the [ISO
8601](https://en.wikipedia.org/wiki/ISO_8601) and, if it has a timezone, [RFC
3339](https://datatracker.ietf.org/doc/html/rfc3339) standards. Input values
that do not conform to both ISO 8601 and RFC 3339 may be coerced, which may lead
to unexpected results.
"""
scalar Datetime

type Repository implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  namespaceId: UUID!
  name: String!
  description: String
  artifactType: String!
  isPublic: Boolean!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Namespace\` that is related to this \`Repository\`."""
  namespace: Namespace

  """Reads and enables pagination through a set of \`Artifact\`."""
  artifacts(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ArtifactCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ArtifactFilter

    """The method to use when ordering \`Artifact\`."""
    orderBy: [ArtifactOrderBy!] = [PRIMARY_KEY_ASC]
  ): ArtifactConnection!

  """Reads and enables pagination through a set of \`Tag\`."""
  tags(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TagCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TagFilter

    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!] = [PRIMARY_KEY_ASC]
  ): TagConnection!

  """Reads and enables pagination through a set of \`UploadSession\`."""
  uploadSessions(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: UploadSessionCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: UploadSessionFilter

    """The method to use when ordering \`UploadSession\`."""
    orderBy: [UploadSessionOrderBy!] = [PRIMARY_KEY_ASC]
  ): UploadSessionConnection!

  """Reads and enables pagination through a set of \`ApiToken\`."""
  apiTokens(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ApiTokenCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ApiTokenFilter

    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!] = [PRIMARY_KEY_ASC]
  ): ApiTokenConnection!
}

type Namespace implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  name: String!
  description: String
  createdAt: Datetime
  updatedAt: Datetime
  organizationId: UUID

  """Reads and enables pagination through a set of \`Repository\`."""
  repositories(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: RepositoryCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: RepositoryFilter

    """The method to use when ordering \`Repository\`."""
    orderBy: [RepositoryOrderBy!] = [PRIMARY_KEY_ASC]
  ): RepositoryConnection!

  """Reads and enables pagination through a set of \`ApiToken\`."""
  apiTokens(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ApiTokenCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ApiTokenFilter

    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!] = [PRIMARY_KEY_ASC]
  ): ApiTokenConnection!
}

"""A connection to a list of \`Repository\` values."""
type RepositoryConnection {
  """A list of \`Repository\` objects."""
  nodes: [Repository]!

  """
  A list of edges which contains the \`Repository\` and cursor to aid in pagination.
  """
  edges: [RepositoryEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Repository\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Repository\` edge in the connection."""
type RepositoryEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Repository\` at the end of the edge."""
  node: Repository
}

"""A location in a connection that can be used for resuming pagination."""
scalar Cursor

"""Information about pagination in a connection."""
type PageInfo {
  """When paginating forwards, are there more items?"""
  hasNextPage: Boolean!

  """When paginating backwards, are there more items?"""
  hasPreviousPage: Boolean!

  """When paginating backwards, the cursor to continue."""
  startCursor: Cursor

  """When paginating forwards, the cursor to continue."""
  endCursor: Cursor
}

"""
A condition to be used against \`Repository\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input RepositoryCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`namespaceId\` field."""
  namespaceId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`artifactType\` field."""
  artifactType: String
}

"""
A filter to be used against \`Repository\` object types. All fields are combined with a logical ‘and.’
"""
input RepositoryFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`namespaceId\` field."""
  namespaceId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`artifactType\` field."""
  artifactType: StringFilter

  """Filter by the object’s \`artifacts\` relation."""
  artifacts: RepositoryToManyArtifactFilter

  """Some related \`artifacts\` exist."""
  artifactsExist: Boolean

  """Filter by the object’s \`tags\` relation."""
  tags: RepositoryToManyTagFilter

  """Some related \`tags\` exist."""
  tagsExist: Boolean

  """Filter by the object’s \`uploadSessions\` relation."""
  uploadSessions: RepositoryToManyUploadSessionFilter

  """Some related \`uploadSessions\` exist."""
  uploadSessionsExist: Boolean

  """Filter by the object’s \`apiTokens\` relation."""
  apiTokens: RepositoryToManyApiTokenFilter

  """Some related \`apiTokens\` exist."""
  apiTokensExist: Boolean

  """Filter by the object’s \`namespace\` relation."""
  namespace: NamespaceFilter

  """Checks for all expressions in this list."""
  and: [RepositoryFilter!]

  """Checks for any expressions in this list."""
  or: [RepositoryFilter!]

  """Negates the expression."""
  not: RepositoryFilter
}

"""
A filter to be used against UUID fields. All fields are combined with a logical ‘and.’
"""
input UUIDFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: UUID

  """Not equal to the specified value."""
  notEqualTo: UUID

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: UUID

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: UUID

  """Included in the specified list."""
  in: [UUID!]

  """Not included in the specified list."""
  notIn: [UUID!]

  """Less than the specified value."""
  lessThan: UUID

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: UUID

  """Greater than the specified value."""
  greaterThan: UUID

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: UUID
}

"""
A filter to be used against String fields. All fields are combined with a logical ‘and.’
"""
input StringFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: String

  """Not equal to the specified value."""
  notEqualTo: String

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: String

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: String

  """Included in the specified list."""
  in: [String!]

  """Not included in the specified list."""
  notIn: [String!]

  """Less than the specified value."""
  lessThan: String

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: String

  """Greater than the specified value."""
  greaterThan: String

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: String

  """Contains the specified string (case-sensitive)."""
  includes: String

  """Does not contain the specified string (case-sensitive)."""
  notIncludes: String

  """Contains the specified string (case-insensitive)."""
  includesInsensitive: String

  """Does not contain the specified string (case-insensitive)."""
  notIncludesInsensitive: String

  """Starts with the specified string (case-sensitive)."""
  startsWith: String

  """Does not start with the specified string (case-sensitive)."""
  notStartsWith: String

  """Starts with the specified string (case-insensitive)."""
  startsWithInsensitive: String

  """Does not start with the specified string (case-insensitive)."""
  notStartsWithInsensitive: String

  """Ends with the specified string (case-sensitive)."""
  endsWith: String

  """Does not end with the specified string (case-sensitive)."""
  notEndsWith: String

  """Ends with the specified string (case-insensitive)."""
  endsWithInsensitive: String

  """Does not end with the specified string (case-insensitive)."""
  notEndsWithInsensitive: String

  """
  Matches the specified pattern (case-sensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  like: String

  """
  Does not match the specified pattern (case-sensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  notLike: String

  """
  Matches the specified pattern (case-insensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  likeInsensitive: String

  """
  Does not match the specified pattern (case-insensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  notLikeInsensitive: String

  """Equal to the specified value (case-insensitive)."""
  equalToInsensitive: String

  """Not equal to the specified value (case-insensitive)."""
  notEqualToInsensitive: String

  """
  Not equal to the specified value, treating null like an ordinary value (case-insensitive).
  """
  distinctFromInsensitive: String

  """
  Equal to the specified value, treating null like an ordinary value (case-insensitive).
  """
  notDistinctFromInsensitive: String

  """Included in the specified list (case-insensitive)."""
  inInsensitive: [String!]

  """Not included in the specified list (case-insensitive)."""
  notInInsensitive: [String!]

  """Less than the specified value (case-insensitive)."""
  lessThanInsensitive: String

  """Less than or equal to the specified value (case-insensitive)."""
  lessThanOrEqualToInsensitive: String

  """Greater than the specified value (case-insensitive)."""
  greaterThanInsensitive: String

  """Greater than or equal to the specified value (case-insensitive)."""
  greaterThanOrEqualToInsensitive: String
}

"""
A filter to be used against many \`Artifact\` object types. All fields are combined with a logical ‘and.’
"""
input RepositoryToManyArtifactFilter {
  """
  Every related \`Artifact\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ArtifactFilter

  """
  Some related \`Artifact\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ArtifactFilter

  """
  No related \`Artifact\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ArtifactFilter
}

"""
A filter to be used against \`Artifact\` object types. All fields are combined with a logical ‘and.’
"""
input ArtifactFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`repositoryId\` field."""
  repositoryId: UUIDFilter

  """Filter by the object’s \`digest\` field."""
  digest: StringFilter

  """Filter by the object’s \`containerMetadatum\` relation."""
  containerMetadatum: ContainerMetadatumFilter

  """A related \`containerMetadatum\` exists."""
  containerMetadatumExists: Boolean

  """Filter by the object’s \`schemaMetadatum\` relation."""
  schemaMetadatum: SchemaMetadatumFilter

  """A related \`schemaMetadatum\` exists."""
  schemaMetadatumExists: Boolean

  """Filter by the object’s \`tags\` relation."""
  tags: ArtifactToManyTagFilter

  """Some related \`tags\` exist."""
  tagsExist: Boolean

  """Filter by the object’s \`wasmMetadatum\` relation."""
  wasmMetadatum: WasmMetadatumFilter

  """A related \`wasmMetadatum\` exists."""
  wasmMetadatumExists: Boolean

  """Filter by the object’s \`cargoMetadata\` relation."""
  cargoMetadata: ArtifactToManyCargoMetadatumFilter

  """Some related \`cargoMetadata\` exist."""
  cargoMetadataExist: Boolean

  """Filter by the object’s \`repository\` relation."""
  repository: RepositoryFilter

  """Checks for all expressions in this list."""
  and: [ArtifactFilter!]

  """Checks for any expressions in this list."""
  or: [ArtifactFilter!]

  """Negates the expression."""
  not: ArtifactFilter
}

"""
A filter to be used against \`ContainerMetadatum\` object types. All fields are combined with a logical ‘and.’
"""
input ContainerMetadatumFilter {
  """Filter by the object’s \`artifactId\` field."""
  artifactId: UUIDFilter

  """Filter by the object’s \`artifact\` relation."""
  artifact: ArtifactFilter

  """Checks for all expressions in this list."""
  and: [ContainerMetadatumFilter!]

  """Checks for any expressions in this list."""
  or: [ContainerMetadatumFilter!]

  """Negates the expression."""
  not: ContainerMetadatumFilter
}

"""
A filter to be used against \`SchemaMetadatum\` object types. All fields are combined with a logical ‘and.’
"""
input SchemaMetadatumFilter {
  """Filter by the object’s \`artifactId\` field."""
  artifactId: UUIDFilter

  """Filter by the object’s \`artifact\` relation."""
  artifact: ArtifactFilter

  """Checks for all expressions in this list."""
  and: [SchemaMetadatumFilter!]

  """Checks for any expressions in this list."""
  or: [SchemaMetadatumFilter!]

  """Negates the expression."""
  not: SchemaMetadatumFilter
}

"""
A filter to be used against many \`Tag\` object types. All fields are combined with a logical ‘and.’
"""
input ArtifactToManyTagFilter {
  """
  Every related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: TagFilter

  """
  Some related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: TagFilter

  """
  No related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: TagFilter
}

"""
A filter to be used against \`Tag\` object types. All fields are combined with a logical ‘and.’
"""
input TagFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`repositoryId\` field."""
  repositoryId: UUIDFilter

  """Filter by the object’s \`artifactId\` field."""
  artifactId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`artifact\` relation."""
  artifact: ArtifactFilter

  """Filter by the object’s \`repository\` relation."""
  repository: RepositoryFilter

  """Checks for all expressions in this list."""
  and: [TagFilter!]

  """Checks for any expressions in this list."""
  or: [TagFilter!]

  """Negates the expression."""
  not: TagFilter
}

"""
A filter to be used against \`WasmMetadatum\` object types. All fields are combined with a logical ‘and.’
"""
input WasmMetadatumFilter {
  """Filter by the object’s \`artifactId\` field."""
  artifactId: UUIDFilter

  """Filter by the object’s \`artifact\` relation."""
  artifact: ArtifactFilter

  """Checks for all expressions in this list."""
  and: [WasmMetadatumFilter!]

  """Checks for any expressions in this list."""
  or: [WasmMetadatumFilter!]

  """Negates the expression."""
  not: WasmMetadatumFilter
}

"""
A filter to be used against many \`CargoMetadatum\` object types. All fields are combined with a logical ‘and.’
"""
input ArtifactToManyCargoMetadatumFilter {
  """
  Every related \`CargoMetadatum\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: CargoMetadatumFilter

  """
  Some related \`CargoMetadatum\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: CargoMetadatumFilter

  """
  No related \`CargoMetadatum\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: CargoMetadatumFilter
}

"""
A filter to be used against \`CargoMetadatum\` object types. All fields are combined with a logical ‘and.’
"""
input CargoMetadatumFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`artifactId\` field."""
  artifactId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`vers\` field."""
  vers: StringFilter

  """Filter by the object’s \`artifact\` relation."""
  artifact: ArtifactFilter

  """Checks for all expressions in this list."""
  and: [CargoMetadatumFilter!]

  """Checks for any expressions in this list."""
  or: [CargoMetadatumFilter!]

  """Negates the expression."""
  not: CargoMetadatumFilter
}

"""
A filter to be used against many \`Tag\` object types. All fields are combined with a logical ‘and.’
"""
input RepositoryToManyTagFilter {
  """
  Every related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: TagFilter

  """
  Some related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: TagFilter

  """
  No related \`Tag\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: TagFilter
}

"""
A filter to be used against many \`UploadSession\` object types. All fields are combined with a logical ‘and.’
"""
input RepositoryToManyUploadSessionFilter {
  """
  Every related \`UploadSession\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: UploadSessionFilter

  """
  Some related \`UploadSession\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: UploadSessionFilter

  """
  No related \`UploadSession\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: UploadSessionFilter
}

"""
A filter to be used against \`UploadSession\` object types. All fields are combined with a logical ‘and.’
"""
input UploadSessionFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`repositoryId\` field."""
  repositoryId: UUIDFilter

  """Filter by the object’s \`expiresAt\` field."""
  expiresAt: DatetimeFilter

  """Filter by the object’s \`repository\` relation."""
  repository: RepositoryFilter

  """Checks for all expressions in this list."""
  and: [UploadSessionFilter!]

  """Checks for any expressions in this list."""
  or: [UploadSessionFilter!]

  """Negates the expression."""
  not: UploadSessionFilter
}

"""
A filter to be used against Datetime fields. All fields are combined with a logical ‘and.’
"""
input DatetimeFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: Datetime

  """Not equal to the specified value."""
  notEqualTo: Datetime

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: Datetime

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: Datetime

  """Included in the specified list."""
  in: [Datetime!]

  """Not included in the specified list."""
  notIn: [Datetime!]

  """Less than the specified value."""
  lessThan: Datetime

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: Datetime

  """Greater than the specified value."""
  greaterThan: Datetime

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: Datetime
}

"""
A filter to be used against many \`ApiToken\` object types. All fields are combined with a logical ‘and.’
"""
input RepositoryToManyApiTokenFilter {
  """
  Every related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ApiTokenFilter

  """
  Some related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ApiTokenFilter

  """
  No related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ApiTokenFilter
}

"""
A filter to be used against \`ApiToken\` object types. All fields are combined with a logical ‘and.’
"""
input ApiTokenFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`tokenHash\` field."""
  tokenHash: StringFilter

  """Filter by the object’s \`tokenPrefix\` field."""
  tokenPrefix: StringFilter

  """Filter by the object’s \`namespaceId\` field."""
  namespaceId: UUIDFilter

  """Filter by the object’s \`repositoryId\` field."""
  repositoryId: UUIDFilter

  """Filter by the object’s \`createdBy\` field."""
  createdBy: StringFilter

  """Filter by the object’s \`isActive\` field."""
  isActive: BooleanFilter

  """Filter by the object’s \`namespace\` relation."""
  namespace: NamespaceFilter

  """Filter by the object’s \`repository\` relation."""
  repository: RepositoryFilter

  """A related \`repository\` exists."""
  repositoryExists: Boolean

  """Checks for all expressions in this list."""
  and: [ApiTokenFilter!]

  """Checks for any expressions in this list."""
  or: [ApiTokenFilter!]

  """Negates the expression."""
  not: ApiTokenFilter
}

"""
A filter to be used against Boolean fields. All fields are combined with a logical ‘and.’
"""
input BooleanFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: Boolean

  """Not equal to the specified value."""
  notEqualTo: Boolean

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: Boolean

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: Boolean

  """Included in the specified list."""
  in: [Boolean!]

  """Not included in the specified list."""
  notIn: [Boolean!]

  """Less than the specified value."""
  lessThan: Boolean

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: Boolean

  """Greater than the specified value."""
  greaterThan: Boolean

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: Boolean
}

"""
A filter to be used against \`Namespace\` object types. All fields are combined with a logical ‘and.’
"""
input NamespaceFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`organizationId\` field."""
  organizationId: UUIDFilter

  """Filter by the object’s \`repositories\` relation."""
  repositories: NamespaceToManyRepositoryFilter

  """Some related \`repositories\` exist."""
  repositoriesExist: Boolean

  """Filter by the object’s \`apiTokens\` relation."""
  apiTokens: NamespaceToManyApiTokenFilter

  """Some related \`apiTokens\` exist."""
  apiTokensExist: Boolean

  """Checks for all expressions in this list."""
  and: [NamespaceFilter!]

  """Checks for any expressions in this list."""
  or: [NamespaceFilter!]

  """Negates the expression."""
  not: NamespaceFilter
}

"""
A filter to be used against many \`Repository\` object types. All fields are combined with a logical ‘and.’
"""
input NamespaceToManyRepositoryFilter {
  """
  Every related \`Repository\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: RepositoryFilter

  """
  Some related \`Repository\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: RepositoryFilter

  """
  No related \`Repository\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: RepositoryFilter
}

"""
A filter to be used against many \`ApiToken\` object types. All fields are combined with a logical ‘and.’
"""
input NamespaceToManyApiTokenFilter {
  """
  Every related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ApiTokenFilter

  """
  Some related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ApiTokenFilter

  """
  No related \`ApiToken\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ApiTokenFilter
}

"""Methods to use when ordering \`Repository\`."""
enum RepositoryOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  NAMESPACE_ID_ASC
  NAMESPACE_ID_DESC
  NAME_ASC
  NAME_DESC
  ARTIFACT_TYPE_ASC
  ARTIFACT_TYPE_DESC
}

"""A connection to a list of \`ApiToken\` values."""
type ApiTokenConnection {
  """A list of \`ApiToken\` objects."""
  nodes: [ApiToken]!

  """
  A list of edges which contains the \`ApiToken\` and cursor to aid in pagination.
  """
  edges: [ApiTokenEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`ApiToken\` you could get from the connection."""
  totalCount: Int!
}

type ApiToken implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  name: String!
  tokenHash: String!
  tokenPrefix: String!
  namespaceId: UUID!
  repositoryId: UUID
  scope: String!
  createdBy: String!
  description: String
  isActive: Boolean!
  expiresAt: Datetime
  lastUsedAt: Datetime
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Namespace\` that is related to this \`ApiToken\`."""
  namespace: Namespace

  """Reads a single \`Repository\` that is related to this \`ApiToken\`."""
  repository: Repository
}

"""A \`ApiToken\` edge in the connection."""
type ApiTokenEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`ApiToken\` at the end of the edge."""
  node: ApiToken
}

"""
A condition to be used against \`ApiToken\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input ApiTokenCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`tokenHash\` field."""
  tokenHash: String

  """Checks for equality with the object’s \`tokenPrefix\` field."""
  tokenPrefix: String

  """Checks for equality with the object’s \`namespaceId\` field."""
  namespaceId: UUID

  """Checks for equality with the object’s \`repositoryId\` field."""
  repositoryId: UUID

  """Checks for equality with the object’s \`createdBy\` field."""
  createdBy: String

  """Checks for equality with the object’s \`isActive\` field."""
  isActive: Boolean
}

"""Methods to use when ordering \`ApiToken\`."""
enum ApiTokenOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  TOKEN_HASH_ASC
  TOKEN_HASH_DESC
  TOKEN_PREFIX_ASC
  TOKEN_PREFIX_DESC
  NAMESPACE_ID_ASC
  NAMESPACE_ID_DESC
  REPOSITORY_ID_ASC
  REPOSITORY_ID_DESC
  CREATED_BY_ASC
  CREATED_BY_DESC
  IS_ACTIVE_ASC
  IS_ACTIVE_DESC
}

"""A connection to a list of \`Artifact\` values."""
type ArtifactConnection {
  """A list of \`Artifact\` objects."""
  nodes: [Artifact]!

  """
  A list of edges which contains the \`Artifact\` and cursor to aid in pagination.
  """
  edges: [ArtifactEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Artifact\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Artifact\` edge in the connection."""
type ArtifactEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Artifact\` at the end of the edge."""
  node: Artifact
}

"""
A condition to be used against \`Artifact\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input ArtifactCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`repositoryId\` field."""
  repositoryId: UUID

  """Checks for equality with the object’s \`digest\` field."""
  digest: String
}

"""Methods to use when ordering \`Artifact\`."""
enum ArtifactOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  REPOSITORY_ID_ASC
  REPOSITORY_ID_DESC
  DIGEST_ASC
  DIGEST_DESC
}

"""A connection to a list of \`Tag\` values."""
type TagConnection {
  """A list of \`Tag\` objects."""
  nodes: [Tag]!

  """
  A list of edges which contains the \`Tag\` and cursor to aid in pagination.
  """
  edges: [TagEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Tag\` you could get from the connection."""
  totalCount: Int!
}

type Tag implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  repositoryId: UUID!
  artifactId: UUID!
  name: String!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Artifact\` that is related to this \`Tag\`."""
  artifact: Artifact

  """Reads a single \`Repository\` that is related to this \`Tag\`."""
  repository: Repository
}

"""A \`Tag\` edge in the connection."""
type TagEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Tag\` at the end of the edge."""
  node: Tag
}

"""
A condition to be used against \`Tag\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input TagCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`repositoryId\` field."""
  repositoryId: UUID

  """Checks for equality with the object’s \`artifactId\` field."""
  artifactId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String
}

"""Methods to use when ordering \`Tag\`."""
enum TagOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  REPOSITORY_ID_ASC
  REPOSITORY_ID_DESC
  ARTIFACT_ID_ASC
  ARTIFACT_ID_DESC
  NAME_ASC
  NAME_DESC
}

"""A connection to a list of \`UploadSession\` values."""
type UploadSessionConnection {
  """A list of \`UploadSession\` objects."""
  nodes: [UploadSession]!

  """
  A list of edges which contains the \`UploadSession\` and cursor to aid in pagination.
  """
  edges: [UploadSessionEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`UploadSession\` you could get from the connection."""
  totalCount: Int!
}

type UploadSession implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  repositoryId: UUID!
  offset: BigInt!
  createdAt: Datetime
  expiresAt: Datetime!

  """Reads a single \`Repository\` that is related to this \`UploadSession\`."""
  repository: Repository
}

"""A \`UploadSession\` edge in the connection."""
type UploadSessionEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`UploadSession\` at the end of the edge."""
  node: UploadSession
}

"""
A condition to be used against \`UploadSession\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input UploadSessionCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`repositoryId\` field."""
  repositoryId: UUID

  """Checks for equality with the object’s \`expiresAt\` field."""
  expiresAt: Datetime
}

"""Methods to use when ordering \`UploadSession\`."""
enum UploadSessionOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  REPOSITORY_ID_ASC
  REPOSITORY_ID_DESC
  EXPIRES_AT_ASC
  EXPIRES_AT_DESC
}

type SchemaMetadatum implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  artifactId: UUID!
  version: String
  title: String
  isValid: Boolean!
  validationErrors: JSON

  """Reads a single \`Artifact\` that is related to this \`SchemaMetadatum\`."""
  artifact: Artifact
}

type WasmMetadatum implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  artifactId: UUID!
  runtime: String
  exports: JSON!
  imports: JSON!

  """Reads a single \`Artifact\` that is related to this \`WasmMetadatum\`."""
  artifact: Artifact
}

"""A connection to a list of \`CargoMetadatum\` values."""
type CargoMetadatumConnection {
  """A list of \`CargoMetadatum\` objects."""
  nodes: [CargoMetadatum]!

  """
  A list of edges which contains the \`CargoMetadatum\` and cursor to aid in pagination.
  """
  edges: [CargoMetadatumEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`CargoMetadatum\` you could get from the connection."""
  totalCount: Int!
}

type CargoMetadatum implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  artifactId: UUID!
  name: String!
  vers: String!
  deps: JSON!
  features: JSON!
  cksum: String!
  yanked: Boolean!
  links: String
  rustVersion: String
  v: Int!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Artifact\` that is related to this \`CargoMetadatum\`."""
  artifact: Artifact
}

"""A \`CargoMetadatum\` edge in the connection."""
type CargoMetadatumEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`CargoMetadatum\` at the end of the edge."""
  node: CargoMetadatum
}

"""
A condition to be used against \`CargoMetadatum\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input CargoMetadatumCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`artifactId\` field."""
  artifactId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`vers\` field."""
  vers: String
}

"""Methods to use when ordering \`CargoMetadatum\`."""
enum CargoMetadatumOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  ARTIFACT_ID_ASC
  ARTIFACT_ID_DESC
  NAME_ASC
  NAME_DESC
  VERS_ASC
  VERS_DESC
}

type FederatedSource implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  namespace: String!
  upstreamBaseUrl: String!
  upstreamType: String!
  enabled: Boolean!
  rateLimitRpm: Int!
  cacheTtlSeconds: Int!
  tagListCacheTtlSeconds: Int!
  requireVetting: Boolean!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads and enables pagination through a set of \`FederatedSkillCache\`."""
  federatedSkillCachesBySourceId(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: FederatedSkillCacheCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: FederatedSkillCacheFilter

    """The method to use when ordering \`FederatedSkillCache\`."""
    orderBy: [FederatedSkillCacheOrderBy!] = [PRIMARY_KEY_ASC]
  ): FederatedSkillCacheConnection!
}

"""A connection to a list of \`FederatedSkillCache\` values."""
type FederatedSkillCacheConnection {
  """A list of \`FederatedSkillCache\` objects."""
  nodes: [FederatedSkillCache]!

  """
  A list of edges which contains the \`FederatedSkillCache\` and cursor to aid in pagination.
  """
  edges: [FederatedSkillCacheEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """
  The count of *all* \`FederatedSkillCache\` you could get from the connection.
  """
  totalCount: Int!
}

type FederatedSkillCache implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  sourceId: UUID!
  slug: String!
  content: String
  contentDigest: String
  fetchedAt: Datetime
  expiresAt: Datetime
  vetStatus: String!
  vetReason: String
  vettedBy: String
  vettedAt: Datetime
  upstreamMeta: JSON
  createdAt: Datetime

  """
  Reads a single \`FederatedSource\` that is related to this \`FederatedSkillCache\`.
  """
  source: FederatedSource
}

"""A \`FederatedSkillCache\` edge in the connection."""
type FederatedSkillCacheEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`FederatedSkillCache\` at the end of the edge."""
  node: FederatedSkillCache
}

"""
A condition to be used against \`FederatedSkillCache\` object types. All fields
are tested for equality and combined with a logical ‘and.’
"""
input FederatedSkillCacheCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`sourceId\` field."""
  sourceId: UUID

  """Checks for equality with the object’s \`slug\` field."""
  slug: String

  """Checks for equality with the object’s \`expiresAt\` field."""
  expiresAt: Datetime

  """Checks for equality with the object’s \`vetStatus\` field."""
  vetStatus: String
}

"""
A filter to be used against \`FederatedSkillCache\` object types. All fields are combined with a logical ‘and.’
"""
input FederatedSkillCacheFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`sourceId\` field."""
  sourceId: UUIDFilter

  """Filter by the object’s \`slug\` field."""
  slug: StringFilter

  """Filter by the object’s \`expiresAt\` field."""
  expiresAt: DatetimeFilter

  """Filter by the object’s \`vetStatus\` field."""
  vetStatus: StringFilter

  """Filter by the object’s \`source\` relation."""
  source: FederatedSourceFilter

  """Checks for all expressions in this list."""
  and: [FederatedSkillCacheFilter!]

  """Checks for any expressions in this list."""
  or: [FederatedSkillCacheFilter!]

  """Negates the expression."""
  not: FederatedSkillCacheFilter
}

"""
A filter to be used against \`FederatedSource\` object types. All fields are combined with a logical ‘and.’
"""
input FederatedSourceFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`namespace\` field."""
  namespace: StringFilter

  """Filter by the object’s \`upstreamType\` field."""
  upstreamType: StringFilter

  """Filter by the object’s \`federatedSkillCachesBySourceId\` relation."""
  federatedSkillCachesBySourceId: FederatedSourceToManyFederatedSkillCacheFilter

  """Some related \`federatedSkillCachesBySourceId\` exist."""
  federatedSkillCachesBySourceIdExist: Boolean

  """Checks for all expressions in this list."""
  and: [FederatedSourceFilter!]

  """Checks for any expressions in this list."""
  or: [FederatedSourceFilter!]

  """Negates the expression."""
  not: FederatedSourceFilter
}

"""
A filter to be used against many \`FederatedSkillCache\` object types. All fields are combined with a logical ‘and.’
"""
input FederatedSourceToManyFederatedSkillCacheFilter {
  """
  Every related \`FederatedSkillCache\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: FederatedSkillCacheFilter

  """
  Some related \`FederatedSkillCache\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: FederatedSkillCacheFilter

  """
  No related \`FederatedSkillCache\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: FederatedSkillCacheFilter
}

"""Methods to use when ordering \`FederatedSkillCache\`."""
enum FederatedSkillCacheOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  SOURCE_ID_ASC
  SOURCE_ID_DESC
  SLUG_ASC
  SLUG_DESC
  EXPIRES_AT_ASC
  EXPIRES_AT_DESC
  VET_STATUS_ASC
  VET_STATUS_DESC
}

"""A connection to a list of \`ContainerMetadatum\` values."""
type ContainerMetadatumConnection {
  """A list of \`ContainerMetadatum\` objects."""
  nodes: [ContainerMetadatum]!

  """
  A list of edges which contains the \`ContainerMetadatum\` and cursor to aid in pagination.
  """
  edges: [ContainerMetadatumEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """
  The count of *all* \`ContainerMetadatum\` you could get from the connection.
  """
  totalCount: Int!
}

"""A \`ContainerMetadatum\` edge in the connection."""
type ContainerMetadatumEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`ContainerMetadatum\` at the end of the edge."""
  node: ContainerMetadatum
}

"""
A condition to be used against \`ContainerMetadatum\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input ContainerMetadatumCondition {
  """Checks for equality with the object’s \`artifactId\` field."""
  artifactId: UUID
}

"""Methods to use when ordering \`ContainerMetadatum\`."""
enum ContainerMetadatumOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ARTIFACT_ID_ASC
  ARTIFACT_ID_DESC
}

"""A connection to a list of \`WasmMetadatum\` values."""
type WasmMetadatumConnection {
  """A list of \`WasmMetadatum\` objects."""
  nodes: [WasmMetadatum]!

  """
  A list of edges which contains the \`WasmMetadatum\` and cursor to aid in pagination.
  """
  edges: [WasmMetadatumEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`WasmMetadatum\` you could get from the connection."""
  totalCount: Int!
}

"""A \`WasmMetadatum\` edge in the connection."""
type WasmMetadatumEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`WasmMetadatum\` at the end of the edge."""
  node: WasmMetadatum
}

"""
A condition to be used against \`WasmMetadatum\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input WasmMetadatumCondition {
  """Checks for equality with the object’s \`artifactId\` field."""
  artifactId: UUID
}

"""Methods to use when ordering \`WasmMetadatum\`."""
enum WasmMetadatumOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ARTIFACT_ID_ASC
  ARTIFACT_ID_DESC
}

"""A connection to a list of \`SchemaMetadatum\` values."""
type SchemaMetadatumConnection {
  """A list of \`SchemaMetadatum\` objects."""
  nodes: [SchemaMetadatum]!

  """
  A list of edges which contains the \`SchemaMetadatum\` and cursor to aid in pagination.
  """
  edges: [SchemaMetadatumEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """
  The count of *all* \`SchemaMetadatum\` you could get from the connection.
  """
  totalCount: Int!
}

"""A \`SchemaMetadatum\` edge in the connection."""
type SchemaMetadatumEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`SchemaMetadatum\` at the end of the edge."""
  node: SchemaMetadatum
}

"""
A condition to be used against \`SchemaMetadatum\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input SchemaMetadatumCondition {
  """Checks for equality with the object’s \`artifactId\` field."""
  artifactId: UUID
}

"""Methods to use when ordering \`SchemaMetadatum\`."""
enum SchemaMetadatumOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ARTIFACT_ID_ASC
  ARTIFACT_ID_DESC
}

"""A connection to a list of \`Namespace\` values."""
type NamespaceConnection {
  """A list of \`Namespace\` objects."""
  nodes: [Namespace]!

  """
  A list of edges which contains the \`Namespace\` and cursor to aid in pagination.
  """
  edges: [NamespaceEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Namespace\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Namespace\` edge in the connection."""
type NamespaceEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Namespace\` at the end of the edge."""
  node: Namespace
}

"""
A condition to be used against \`Namespace\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input NamespaceCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`organizationId\` field."""
  organizationId: UUID
}

"""Methods to use when ordering \`Namespace\`."""
enum NamespaceOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  NAME_ASC
  NAME_DESC
  ORGANIZATION_ID_ASC
  ORGANIZATION_ID_DESC
}

"""A connection to a list of \`FederatedSource\` values."""
type FederatedSourceConnection {
  """A list of \`FederatedSource\` objects."""
  nodes: [FederatedSource]!

  """
  A list of edges which contains the \`FederatedSource\` and cursor to aid in pagination.
  """
  edges: [FederatedSourceEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """
  The count of *all* \`FederatedSource\` you could get from the connection.
  """
  totalCount: Int!
}

"""A \`FederatedSource\` edge in the connection."""
type FederatedSourceEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`FederatedSource\` at the end of the edge."""
  node: FederatedSource
}

"""
A condition to be used against \`FederatedSource\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input FederatedSourceCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`namespace\` field."""
  namespace: String

  """Checks for equality with the object’s \`upstreamType\` field."""
  upstreamType: String
}

"""Methods to use when ordering \`FederatedSource\`."""
enum FederatedSourceOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  NAMESPACE_ASC
  NAMESPACE_DESC
  UPSTREAM_TYPE_ASC
  UPSTREAM_TYPE_DESC
}

"""
The root mutation type which contains root level fields which mutate data.
"""
type Mutation {
  """Creates a single \`ContainerMetadatum\`."""
  createContainerMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateContainerMetadatumInput!
  ): CreateContainerMetadatumPayload

  """Creates a single \`WasmMetadatum\`."""
  createWasmMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateWasmMetadatumInput!
  ): CreateWasmMetadatumPayload

  """Creates a single \`Tag\`."""
  createTag(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateTagInput!
  ): CreateTagPayload

  """Creates a single \`UploadSession\`."""
  createUploadSession(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateUploadSessionInput!
  ): CreateUploadSessionPayload

  """Creates a single \`Artifact\`."""
  createArtifact(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateArtifactInput!
  ): CreateArtifactPayload

  """Creates a single \`SchemaMetadatum\`."""
  createSchemaMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateSchemaMetadatumInput!
  ): CreateSchemaMetadatumPayload

  """Creates a single \`Namespace\`."""
  createNamespace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateNamespaceInput!
  ): CreateNamespacePayload

  """Creates a single \`Repository\`."""
  createRepository(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateRepositoryInput!
  ): CreateRepositoryPayload

  """Creates a single \`FederatedSource\`."""
  createFederatedSource(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateFederatedSourceInput!
  ): CreateFederatedSourcePayload

  """Creates a single \`FederatedSkillCache\`."""
  createFederatedSkillCache(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateFederatedSkillCacheInput!
  ): CreateFederatedSkillCachePayload

  """Creates a single \`CargoMetadatum\`."""
  createCargoMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateCargoMetadatumInput!
  ): CreateCargoMetadatumPayload

  """Creates a single \`ApiToken\`."""
  createApiToken(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateApiTokenInput!
  ): CreateApiTokenPayload

  """
  Updates a single \`ContainerMetadatum\` using its globally unique id and a patch.
  """
  updateContainerMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateContainerMetadatumByIdInput!
  ): UpdateContainerMetadatumPayload

  """Updates a single \`ContainerMetadatum\` using a unique key and a patch."""
  updateContainerMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateContainerMetadatumInput!
  ): UpdateContainerMetadatumPayload

  """
  Updates a single \`WasmMetadatum\` using its globally unique id and a patch.
  """
  updateWasmMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWasmMetadatumByIdInput!
  ): UpdateWasmMetadatumPayload

  """Updates a single \`WasmMetadatum\` using a unique key and a patch."""
  updateWasmMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWasmMetadatumInput!
  ): UpdateWasmMetadatumPayload

  """Updates a single \`Tag\` using its globally unique id and a patch."""
  updateTagById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTagByIdInput!
  ): UpdateTagPayload

  """Updates a single \`Tag\` using a unique key and a patch."""
  updateTag(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTagInput!
  ): UpdateTagPayload

  """
  Updates a single \`UploadSession\` using its globally unique id and a patch.
  """
  updateUploadSessionById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateUploadSessionByIdInput!
  ): UpdateUploadSessionPayload

  """Updates a single \`UploadSession\` using a unique key and a patch."""
  updateUploadSession(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateUploadSessionInput!
  ): UpdateUploadSessionPayload

  """Updates a single \`Artifact\` using its globally unique id and a patch."""
  updateArtifactById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateArtifactByIdInput!
  ): UpdateArtifactPayload

  """Updates a single \`Artifact\` using a unique key and a patch."""
  updateArtifact(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateArtifactInput!
  ): UpdateArtifactPayload

  """
  Updates a single \`SchemaMetadatum\` using its globally unique id and a patch.
  """
  updateSchemaMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateSchemaMetadatumByIdInput!
  ): UpdateSchemaMetadatumPayload

  """Updates a single \`SchemaMetadatum\` using a unique key and a patch."""
  updateSchemaMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateSchemaMetadatumInput!
  ): UpdateSchemaMetadatumPayload

  """Updates a single \`Namespace\` using its globally unique id and a patch."""
  updateNamespaceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateNamespaceByIdInput!
  ): UpdateNamespacePayload

  """Updates a single \`Namespace\` using a unique key and a patch."""
  updateNamespace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateNamespaceInput!
  ): UpdateNamespacePayload

  """Updates a single \`Namespace\` using a unique key and a patch."""
  updateNamespaceByName(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateNamespaceByNameInput!
  ): UpdateNamespacePayload

  """
  Updates a single \`Repository\` using its globally unique id and a patch.
  """
  updateRepositoryById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateRepositoryByIdInput!
  ): UpdateRepositoryPayload

  """Updates a single \`Repository\` using a unique key and a patch."""
  updateRepository(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateRepositoryInput!
  ): UpdateRepositoryPayload

  """
  Updates a single \`FederatedSource\` using its globally unique id and a patch.
  """
  updateFederatedSourceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateFederatedSourceByIdInput!
  ): UpdateFederatedSourcePayload

  """Updates a single \`FederatedSource\` using a unique key and a patch."""
  updateFederatedSource(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateFederatedSourceInput!
  ): UpdateFederatedSourcePayload

  """Updates a single \`FederatedSource\` using a unique key and a patch."""
  updateFederatedSourceByNamespace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateFederatedSourceByNamespaceInput!
  ): UpdateFederatedSourcePayload

  """
  Updates a single \`FederatedSkillCache\` using its globally unique id and a patch.
  """
  updateFederatedSkillCacheById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateFederatedSkillCacheByIdInput!
  ): UpdateFederatedSkillCachePayload

  """Updates a single \`FederatedSkillCache\` using a unique key and a patch."""
  updateFederatedSkillCache(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateFederatedSkillCacheInput!
  ): UpdateFederatedSkillCachePayload

  """
  Updates a single \`CargoMetadatum\` using its globally unique id and a patch.
  """
  updateCargoMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateCargoMetadatumByIdInput!
  ): UpdateCargoMetadatumPayload

  """Updates a single \`CargoMetadatum\` using a unique key and a patch."""
  updateCargoMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateCargoMetadatumInput!
  ): UpdateCargoMetadatumPayload

  """Updates a single \`ApiToken\` using its globally unique id and a patch."""
  updateApiTokenById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateApiTokenByIdInput!
  ): UpdateApiTokenPayload

  """Updates a single \`ApiToken\` using a unique key and a patch."""
  updateApiToken(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateApiTokenInput!
  ): UpdateApiTokenPayload

  """Deletes a single \`ContainerMetadatum\` using its globally unique id."""
  deleteContainerMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteContainerMetadatumByIdInput!
  ): DeleteContainerMetadatumPayload

  """Deletes a single \`ContainerMetadatum\` using a unique key."""
  deleteContainerMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteContainerMetadatumInput!
  ): DeleteContainerMetadatumPayload

  """Deletes a single \`WasmMetadatum\` using its globally unique id."""
  deleteWasmMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWasmMetadatumByIdInput!
  ): DeleteWasmMetadatumPayload

  """Deletes a single \`WasmMetadatum\` using a unique key."""
  deleteWasmMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWasmMetadatumInput!
  ): DeleteWasmMetadatumPayload

  """Deletes a single \`Tag\` using its globally unique id."""
  deleteTagById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTagByIdInput!
  ): DeleteTagPayload

  """Deletes a single \`Tag\` using a unique key."""
  deleteTag(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTagInput!
  ): DeleteTagPayload

  """Deletes a single \`UploadSession\` using its globally unique id."""
  deleteUploadSessionById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteUploadSessionByIdInput!
  ): DeleteUploadSessionPayload

  """Deletes a single \`UploadSession\` using a unique key."""
  deleteUploadSession(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteUploadSessionInput!
  ): DeleteUploadSessionPayload

  """Deletes a single \`Artifact\` using its globally unique id."""
  deleteArtifactById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteArtifactByIdInput!
  ): DeleteArtifactPayload

  """Deletes a single \`Artifact\` using a unique key."""
  deleteArtifact(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteArtifactInput!
  ): DeleteArtifactPayload

  """Deletes a single \`SchemaMetadatum\` using its globally unique id."""
  deleteSchemaMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteSchemaMetadatumByIdInput!
  ): DeleteSchemaMetadatumPayload

  """Deletes a single \`SchemaMetadatum\` using a unique key."""
  deleteSchemaMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteSchemaMetadatumInput!
  ): DeleteSchemaMetadatumPayload

  """Deletes a single \`Namespace\` using its globally unique id."""
  deleteNamespaceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteNamespaceByIdInput!
  ): DeleteNamespacePayload

  """Deletes a single \`Namespace\` using a unique key."""
  deleteNamespace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteNamespaceInput!
  ): DeleteNamespacePayload

  """Deletes a single \`Namespace\` using a unique key."""
  deleteNamespaceByName(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteNamespaceByNameInput!
  ): DeleteNamespacePayload

  """Deletes a single \`Repository\` using its globally unique id."""
  deleteRepositoryById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteRepositoryByIdInput!
  ): DeleteRepositoryPayload

  """Deletes a single \`Repository\` using a unique key."""
  deleteRepository(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteRepositoryInput!
  ): DeleteRepositoryPayload

  """Deletes a single \`FederatedSource\` using its globally unique id."""
  deleteFederatedSourceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteFederatedSourceByIdInput!
  ): DeleteFederatedSourcePayload

  """Deletes a single \`FederatedSource\` using a unique key."""
  deleteFederatedSource(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteFederatedSourceInput!
  ): DeleteFederatedSourcePayload

  """Deletes a single \`FederatedSource\` using a unique key."""
  deleteFederatedSourceByNamespace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteFederatedSourceByNamespaceInput!
  ): DeleteFederatedSourcePayload

  """Deletes a single \`FederatedSkillCache\` using its globally unique id."""
  deleteFederatedSkillCacheById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteFederatedSkillCacheByIdInput!
  ): DeleteFederatedSkillCachePayload

  """Deletes a single \`FederatedSkillCache\` using a unique key."""
  deleteFederatedSkillCache(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteFederatedSkillCacheInput!
  ): DeleteFederatedSkillCachePayload

  """Deletes a single \`CargoMetadatum\` using its globally unique id."""
  deleteCargoMetadatumById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteCargoMetadatumByIdInput!
  ): DeleteCargoMetadatumPayload

  """Deletes a single \`CargoMetadatum\` using a unique key."""
  deleteCargoMetadatum(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteCargoMetadatumInput!
  ): DeleteCargoMetadatumPayload

  """Deletes a single \`ApiToken\` using its globally unique id."""
  deleteApiTokenById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteApiTokenByIdInput!
  ): DeleteApiTokenPayload

  """Deletes a single \`ApiToken\` using a unique key."""
  deleteApiToken(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteApiTokenInput!
  ): DeleteApiTokenPayload
}

"""The output of our create \`ContainerMetadatum\` mutation."""
type CreateContainerMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ContainerMetadatum\` that was created by this mutation."""
  containerMetadatum: ContainerMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ContainerMetadatum\`. May be used by Relay 1."""
  containerMetadatumEdge(
    """The method to use when ordering \`ContainerMetadatum\`."""
    orderBy: [ContainerMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ContainerMetadatumEdge
}

"""All input for the create \`ContainerMetadatum\` mutation."""
input CreateContainerMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`ContainerMetadatum\` to be created by this mutation."""
  containerMetadatum: ContainerMetadatumInput!
}

"""An input for mutations affecting \`ContainerMetadatum\`"""
input ContainerMetadatumInput {
  artifactId: UUID!
  schemaVersion: Int!
  architecture: String
  os: String
  configDigest: String
  layerDigests: JSON
}

"""The output of our create \`WasmMetadatum\` mutation."""
type CreateWasmMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WasmMetadatum\` that was created by this mutation."""
  wasmMetadatum: WasmMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WasmMetadatum\`. May be used by Relay 1."""
  wasmMetadatumEdge(
    """The method to use when ordering \`WasmMetadatum\`."""
    orderBy: [WasmMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WasmMetadatumEdge
}

"""All input for the create \`WasmMetadatum\` mutation."""
input CreateWasmMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`WasmMetadatum\` to be created by this mutation."""
  wasmMetadatum: WasmMetadatumInput!
}

"""An input for mutations affecting \`WasmMetadatum\`"""
input WasmMetadatumInput {
  artifactId: UUID!
  runtime: String
  exports: JSON
  imports: JSON
}

"""The output of our create \`Tag\` mutation."""
type CreateTagPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Tag\` that was created by this mutation."""
  tag: Tag

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Tag\`. May be used by Relay 1."""
  tagEdge(
    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TagEdge
}

"""All input for the create \`Tag\` mutation."""
input CreateTagInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Tag\` to be created by this mutation."""
  tag: TagInput!
}

"""An input for mutations affecting \`Tag\`"""
input TagInput {
  rowId: UUID
  repositoryId: UUID!
  artifactId: UUID!
  name: String!
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`UploadSession\` mutation."""
type CreateUploadSessionPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`UploadSession\` that was created by this mutation."""
  uploadSession: UploadSession

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`UploadSession\`. May be used by Relay 1."""
  uploadSessionEdge(
    """The method to use when ordering \`UploadSession\`."""
    orderBy: [UploadSessionOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UploadSessionEdge
}

"""All input for the create \`UploadSession\` mutation."""
input CreateUploadSessionInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`UploadSession\` to be created by this mutation."""
  uploadSession: UploadSessionInput!
}

"""An input for mutations affecting \`UploadSession\`"""
input UploadSessionInput {
  rowId: UUID
  repositoryId: UUID!
  offset: BigInt
  createdAt: Datetime
  expiresAt: Datetime!
}

"""The output of our create \`Artifact\` mutation."""
type CreateArtifactPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Artifact\` that was created by this mutation."""
  artifact: Artifact

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Artifact\`. May be used by Relay 1."""
  artifactEdge(
    """The method to use when ordering \`Artifact\`."""
    orderBy: [ArtifactOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ArtifactEdge
}

"""All input for the create \`Artifact\` mutation."""
input CreateArtifactInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Artifact\` to be created by this mutation."""
  artifact: ArtifactInput!
}

"""An input for mutations affecting \`Artifact\`"""
input ArtifactInput {
  rowId: UUID
  repositoryId: UUID!
  digest: String!
  size: BigInt!
  mediaType: String!
  content: String
  createdAt: Datetime
  storagePath: String
}

"""The output of our create \`SchemaMetadatum\` mutation."""
type CreateSchemaMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`SchemaMetadatum\` that was created by this mutation."""
  schemaMetadatum: SchemaMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`SchemaMetadatum\`. May be used by Relay 1."""
  schemaMetadatumEdge(
    """The method to use when ordering \`SchemaMetadatum\`."""
    orderBy: [SchemaMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): SchemaMetadatumEdge
}

"""All input for the create \`SchemaMetadatum\` mutation."""
input CreateSchemaMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`SchemaMetadatum\` to be created by this mutation."""
  schemaMetadatum: SchemaMetadatumInput!
}

"""An input for mutations affecting \`SchemaMetadatum\`"""
input SchemaMetadatumInput {
  artifactId: UUID!
  version: String
  title: String
  isValid: Boolean
  validationErrors: JSON
}

"""The output of our create \`Namespace\` mutation."""
type CreateNamespacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Namespace\` that was created by this mutation."""
  namespace: Namespace

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Namespace\`. May be used by Relay 1."""
  namespaceEdge(
    """The method to use when ordering \`Namespace\`."""
    orderBy: [NamespaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): NamespaceEdge
}

"""All input for the create \`Namespace\` mutation."""
input CreateNamespaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Namespace\` to be created by this mutation."""
  namespace: NamespaceInput!
}

"""An input for mutations affecting \`Namespace\`"""
input NamespaceInput {
  rowId: UUID
  name: String!
  description: String
  createdAt: Datetime
  updatedAt: Datetime
  organizationId: UUID
}

"""The output of our create \`Repository\` mutation."""
type CreateRepositoryPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Repository\` that was created by this mutation."""
  repository: Repository

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Repository\`. May be used by Relay 1."""
  repositoryEdge(
    """The method to use when ordering \`Repository\`."""
    orderBy: [RepositoryOrderBy!]! = [PRIMARY_KEY_ASC]
  ): RepositoryEdge
}

"""All input for the create \`Repository\` mutation."""
input CreateRepositoryInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Repository\` to be created by this mutation."""
  repository: RepositoryInput!
}

"""An input for mutations affecting \`Repository\`"""
input RepositoryInput {
  rowId: UUID
  namespaceId: UUID!
  name: String!
  description: String
  artifactType: String!
  isPublic: Boolean
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`FederatedSource\` mutation."""
type CreateFederatedSourcePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSource\` that was created by this mutation."""
  federatedSource: FederatedSource

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSource\`. May be used by Relay 1."""
  federatedSourceEdge(
    """The method to use when ordering \`FederatedSource\`."""
    orderBy: [FederatedSourceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSourceEdge
}

"""All input for the create \`FederatedSource\` mutation."""
input CreateFederatedSourceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`FederatedSource\` to be created by this mutation."""
  federatedSource: FederatedSourceInput!
}

"""An input for mutations affecting \`FederatedSource\`"""
input FederatedSourceInput {
  rowId: UUID
  namespace: String!
  upstreamBaseUrl: String!
  upstreamType: String!
  enabled: Boolean
  rateLimitRpm: Int
  cacheTtlSeconds: Int
  tagListCacheTtlSeconds: Int
  requireVetting: Boolean
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`FederatedSkillCache\` mutation."""
type CreateFederatedSkillCachePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSkillCache\` that was created by this mutation."""
  federatedSkillCache: FederatedSkillCache

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSkillCache\`. May be used by Relay 1."""
  federatedSkillCacheEdge(
    """The method to use when ordering \`FederatedSkillCache\`."""
    orderBy: [FederatedSkillCacheOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSkillCacheEdge
}

"""All input for the create \`FederatedSkillCache\` mutation."""
input CreateFederatedSkillCacheInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`FederatedSkillCache\` to be created by this mutation."""
  federatedSkillCache: FederatedSkillCacheInput!
}

"""An input for mutations affecting \`FederatedSkillCache\`"""
input FederatedSkillCacheInput {
  rowId: UUID
  sourceId: UUID!
  slug: String!
  content: String
  contentDigest: String
  fetchedAt: Datetime
  expiresAt: Datetime
  vetStatus: String
  vetReason: String
  vettedBy: String
  vettedAt: Datetime
  upstreamMeta: JSON
  createdAt: Datetime
}

"""The output of our create \`CargoMetadatum\` mutation."""
type CreateCargoMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`CargoMetadatum\` that was created by this mutation."""
  cargoMetadatum: CargoMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`CargoMetadatum\`. May be used by Relay 1."""
  cargoMetadatumEdge(
    """The method to use when ordering \`CargoMetadatum\`."""
    orderBy: [CargoMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): CargoMetadatumEdge
}

"""All input for the create \`CargoMetadatum\` mutation."""
input CreateCargoMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`CargoMetadatum\` to be created by this mutation."""
  cargoMetadatum: CargoMetadatumInput!
}

"""An input for mutations affecting \`CargoMetadatum\`"""
input CargoMetadatumInput {
  rowId: UUID
  artifactId: UUID!
  name: String!
  vers: String!
  deps: JSON
  features: JSON
  cksum: String!
  yanked: Boolean
  links: String
  rustVersion: String
  v: Int
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`ApiToken\` mutation."""
type CreateApiTokenPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ApiToken\` that was created by this mutation."""
  apiToken: ApiToken

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ApiToken\`. May be used by Relay 1."""
  apiTokenEdge(
    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ApiTokenEdge
}

"""All input for the create \`ApiToken\` mutation."""
input CreateApiTokenInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`ApiToken\` to be created by this mutation."""
  apiToken: ApiTokenInput!
}

"""An input for mutations affecting \`ApiToken\`"""
input ApiTokenInput {
  rowId: UUID
  name: String!
  tokenHash: String!
  tokenPrefix: String!
  namespaceId: UUID!
  repositoryId: UUID
  scope: String
  createdBy: String!
  description: String
  isActive: Boolean
  expiresAt: Datetime
  lastUsedAt: Datetime
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our update \`ContainerMetadatum\` mutation."""
type UpdateContainerMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ContainerMetadatum\` that was updated by this mutation."""
  containerMetadatum: ContainerMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ContainerMetadatum\`. May be used by Relay 1."""
  containerMetadatumEdge(
    """The method to use when ordering \`ContainerMetadatum\`."""
    orderBy: [ContainerMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ContainerMetadatumEdge
}

"""All input for the \`updateContainerMetadatumById\` mutation."""
input UpdateContainerMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ContainerMetadatum\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`ContainerMetadatum\` being updated.
  """
  patch: ContainerMetadatumPatch!
}

"""
Represents an update to a \`ContainerMetadatum\`. Fields that are set will be updated.
"""
input ContainerMetadatumPatch {
  artifactId: UUID
  schemaVersion: Int
  architecture: String
  os: String
  configDigest: String
  layerDigests: JSON
}

"""All input for the \`updateContainerMetadatum\` mutation."""
input UpdateContainerMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!

  """
  An object where the defined keys will be set on the \`ContainerMetadatum\` being updated.
  """
  patch: ContainerMetadatumPatch!
}

"""The output of our update \`WasmMetadatum\` mutation."""
type UpdateWasmMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WasmMetadatum\` that was updated by this mutation."""
  wasmMetadatum: WasmMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WasmMetadatum\`. May be used by Relay 1."""
  wasmMetadatumEdge(
    """The method to use when ordering \`WasmMetadatum\`."""
    orderBy: [WasmMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WasmMetadatumEdge
}

"""All input for the \`updateWasmMetadatumById\` mutation."""
input UpdateWasmMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`WasmMetadatum\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`WasmMetadatum\` being updated.
  """
  patch: WasmMetadatumPatch!
}

"""
Represents an update to a \`WasmMetadatum\`. Fields that are set will be updated.
"""
input WasmMetadatumPatch {
  artifactId: UUID
  runtime: String
  exports: JSON
  imports: JSON
}

"""All input for the \`updateWasmMetadatum\` mutation."""
input UpdateWasmMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!

  """
  An object where the defined keys will be set on the \`WasmMetadatum\` being updated.
  """
  patch: WasmMetadatumPatch!
}

"""The output of our update \`Tag\` mutation."""
type UpdateTagPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Tag\` that was updated by this mutation."""
  tag: Tag

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Tag\`. May be used by Relay 1."""
  tagEdge(
    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TagEdge
}

"""All input for the \`updateTagById\` mutation."""
input UpdateTagByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Tag\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Tag\` being updated.
  """
  patch: TagPatch!
}

"""Represents an update to a \`Tag\`. Fields that are set will be updated."""
input TagPatch {
  rowId: UUID
  repositoryId: UUID
  artifactId: UUID
  name: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateTag\` mutation."""
input UpdateTagInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Tag\` being updated.
  """
  patch: TagPatch!
}

"""The output of our update \`UploadSession\` mutation."""
type UpdateUploadSessionPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`UploadSession\` that was updated by this mutation."""
  uploadSession: UploadSession

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`UploadSession\`. May be used by Relay 1."""
  uploadSessionEdge(
    """The method to use when ordering \`UploadSession\`."""
    orderBy: [UploadSessionOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UploadSessionEdge
}

"""All input for the \`updateUploadSessionById\` mutation."""
input UpdateUploadSessionByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`UploadSession\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`UploadSession\` being updated.
  """
  patch: UploadSessionPatch!
}

"""
Represents an update to a \`UploadSession\`. Fields that are set will be updated.
"""
input UploadSessionPatch {
  rowId: UUID
  repositoryId: UUID
  offset: BigInt
  createdAt: Datetime
  expiresAt: Datetime
}

"""All input for the \`updateUploadSession\` mutation."""
input UpdateUploadSessionInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`UploadSession\` being updated.
  """
  patch: UploadSessionPatch!
}

"""The output of our update \`Artifact\` mutation."""
type UpdateArtifactPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Artifact\` that was updated by this mutation."""
  artifact: Artifact

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Artifact\`. May be used by Relay 1."""
  artifactEdge(
    """The method to use when ordering \`Artifact\`."""
    orderBy: [ArtifactOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ArtifactEdge
}

"""All input for the \`updateArtifactById\` mutation."""
input UpdateArtifactByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Artifact\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Artifact\` being updated.
  """
  patch: ArtifactPatch!
}

"""
Represents an update to a \`Artifact\`. Fields that are set will be updated.
"""
input ArtifactPatch {
  rowId: UUID
  repositoryId: UUID
  digest: String
  size: BigInt
  mediaType: String
  content: String
  createdAt: Datetime
  storagePath: String
}

"""All input for the \`updateArtifact\` mutation."""
input UpdateArtifactInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Artifact\` being updated.
  """
  patch: ArtifactPatch!
}

"""The output of our update \`SchemaMetadatum\` mutation."""
type UpdateSchemaMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`SchemaMetadatum\` that was updated by this mutation."""
  schemaMetadatum: SchemaMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`SchemaMetadatum\`. May be used by Relay 1."""
  schemaMetadatumEdge(
    """The method to use when ordering \`SchemaMetadatum\`."""
    orderBy: [SchemaMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): SchemaMetadatumEdge
}

"""All input for the \`updateSchemaMetadatumById\` mutation."""
input UpdateSchemaMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`SchemaMetadatum\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`SchemaMetadatum\` being updated.
  """
  patch: SchemaMetadatumPatch!
}

"""
Represents an update to a \`SchemaMetadatum\`. Fields that are set will be updated.
"""
input SchemaMetadatumPatch {
  artifactId: UUID
  version: String
  title: String
  isValid: Boolean
  validationErrors: JSON
}

"""All input for the \`updateSchemaMetadatum\` mutation."""
input UpdateSchemaMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!

  """
  An object where the defined keys will be set on the \`SchemaMetadatum\` being updated.
  """
  patch: SchemaMetadatumPatch!
}

"""The output of our update \`Namespace\` mutation."""
type UpdateNamespacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Namespace\` that was updated by this mutation."""
  namespace: Namespace

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Namespace\`. May be used by Relay 1."""
  namespaceEdge(
    """The method to use when ordering \`Namespace\`."""
    orderBy: [NamespaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): NamespaceEdge
}

"""All input for the \`updateNamespaceById\` mutation."""
input UpdateNamespaceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Namespace\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Namespace\` being updated.
  """
  patch: NamespacePatch!
}

"""
Represents an update to a \`Namespace\`. Fields that are set will be updated.
"""
input NamespacePatch {
  rowId: UUID
  name: String
  description: String
  createdAt: Datetime
  updatedAt: Datetime
  organizationId: UUID
}

"""All input for the \`updateNamespace\` mutation."""
input UpdateNamespaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Namespace\` being updated.
  """
  patch: NamespacePatch!
}

"""All input for the \`updateNamespaceByName\` mutation."""
input UpdateNamespaceByNameInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  name: String!

  """
  An object where the defined keys will be set on the \`Namespace\` being updated.
  """
  patch: NamespacePatch!
}

"""The output of our update \`Repository\` mutation."""
type UpdateRepositoryPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Repository\` that was updated by this mutation."""
  repository: Repository

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Repository\`. May be used by Relay 1."""
  repositoryEdge(
    """The method to use when ordering \`Repository\`."""
    orderBy: [RepositoryOrderBy!]! = [PRIMARY_KEY_ASC]
  ): RepositoryEdge
}

"""All input for the \`updateRepositoryById\` mutation."""
input UpdateRepositoryByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Repository\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Repository\` being updated.
  """
  patch: RepositoryPatch!
}

"""
Represents an update to a \`Repository\`. Fields that are set will be updated.
"""
input RepositoryPatch {
  rowId: UUID
  namespaceId: UUID
  name: String
  description: String
  artifactType: String
  isPublic: Boolean
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateRepository\` mutation."""
input UpdateRepositoryInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Repository\` being updated.
  """
  patch: RepositoryPatch!
}

"""The output of our update \`FederatedSource\` mutation."""
type UpdateFederatedSourcePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSource\` that was updated by this mutation."""
  federatedSource: FederatedSource

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSource\`. May be used by Relay 1."""
  federatedSourceEdge(
    """The method to use when ordering \`FederatedSource\`."""
    orderBy: [FederatedSourceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSourceEdge
}

"""All input for the \`updateFederatedSourceById\` mutation."""
input UpdateFederatedSourceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`FederatedSource\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`FederatedSource\` being updated.
  """
  patch: FederatedSourcePatch!
}

"""
Represents an update to a \`FederatedSource\`. Fields that are set will be updated.
"""
input FederatedSourcePatch {
  rowId: UUID
  namespace: String
  upstreamBaseUrl: String
  upstreamType: String
  enabled: Boolean
  rateLimitRpm: Int
  cacheTtlSeconds: Int
  tagListCacheTtlSeconds: Int
  requireVetting: Boolean
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateFederatedSource\` mutation."""
input UpdateFederatedSourceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`FederatedSource\` being updated.
  """
  patch: FederatedSourcePatch!
}

"""All input for the \`updateFederatedSourceByNamespace\` mutation."""
input UpdateFederatedSourceByNamespaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  namespace: String!

  """
  An object where the defined keys will be set on the \`FederatedSource\` being updated.
  """
  patch: FederatedSourcePatch!
}

"""The output of our update \`FederatedSkillCache\` mutation."""
type UpdateFederatedSkillCachePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSkillCache\` that was updated by this mutation."""
  federatedSkillCache: FederatedSkillCache

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSkillCache\`. May be used by Relay 1."""
  federatedSkillCacheEdge(
    """The method to use when ordering \`FederatedSkillCache\`."""
    orderBy: [FederatedSkillCacheOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSkillCacheEdge
}

"""All input for the \`updateFederatedSkillCacheById\` mutation."""
input UpdateFederatedSkillCacheByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`FederatedSkillCache\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`FederatedSkillCache\` being updated.
  """
  patch: FederatedSkillCachePatch!
}

"""
Represents an update to a \`FederatedSkillCache\`. Fields that are set will be updated.
"""
input FederatedSkillCachePatch {
  rowId: UUID
  sourceId: UUID
  slug: String
  content: String
  contentDigest: String
  fetchedAt: Datetime
  expiresAt: Datetime
  vetStatus: String
  vetReason: String
  vettedBy: String
  vettedAt: Datetime
  upstreamMeta: JSON
  createdAt: Datetime
}

"""All input for the \`updateFederatedSkillCache\` mutation."""
input UpdateFederatedSkillCacheInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`FederatedSkillCache\` being updated.
  """
  patch: FederatedSkillCachePatch!
}

"""The output of our update \`CargoMetadatum\` mutation."""
type UpdateCargoMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`CargoMetadatum\` that was updated by this mutation."""
  cargoMetadatum: CargoMetadatum

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`CargoMetadatum\`. May be used by Relay 1."""
  cargoMetadatumEdge(
    """The method to use when ordering \`CargoMetadatum\`."""
    orderBy: [CargoMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): CargoMetadatumEdge
}

"""All input for the \`updateCargoMetadatumById\` mutation."""
input UpdateCargoMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`CargoMetadatum\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`CargoMetadatum\` being updated.
  """
  patch: CargoMetadatumPatch!
}

"""
Represents an update to a \`CargoMetadatum\`. Fields that are set will be updated.
"""
input CargoMetadatumPatch {
  rowId: UUID
  artifactId: UUID
  name: String
  vers: String
  deps: JSON
  features: JSON
  cksum: String
  yanked: Boolean
  links: String
  rustVersion: String
  v: Int
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateCargoMetadatum\` mutation."""
input UpdateCargoMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`CargoMetadatum\` being updated.
  """
  patch: CargoMetadatumPatch!
}

"""The output of our update \`ApiToken\` mutation."""
type UpdateApiTokenPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ApiToken\` that was updated by this mutation."""
  apiToken: ApiToken

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ApiToken\`. May be used by Relay 1."""
  apiTokenEdge(
    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ApiTokenEdge
}

"""All input for the \`updateApiTokenById\` mutation."""
input UpdateApiTokenByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ApiToken\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`ApiToken\` being updated.
  """
  patch: ApiTokenPatch!
}

"""
Represents an update to a \`ApiToken\`. Fields that are set will be updated.
"""
input ApiTokenPatch {
  rowId: UUID
  name: String
  tokenHash: String
  tokenPrefix: String
  namespaceId: UUID
  repositoryId: UUID
  scope: String
  createdBy: String
  description: String
  isActive: Boolean
  expiresAt: Datetime
  lastUsedAt: Datetime
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateApiToken\` mutation."""
input UpdateApiTokenInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`ApiToken\` being updated.
  """
  patch: ApiTokenPatch!
}

"""The output of our delete \`ContainerMetadatum\` mutation."""
type DeleteContainerMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ContainerMetadatum\` that was deleted by this mutation."""
  containerMetadatum: ContainerMetadatum
  deletedContainerMetadatumId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ContainerMetadatum\`. May be used by Relay 1."""
  containerMetadatumEdge(
    """The method to use when ordering \`ContainerMetadatum\`."""
    orderBy: [ContainerMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ContainerMetadatumEdge
}

"""All input for the \`deleteContainerMetadatumById\` mutation."""
input DeleteContainerMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ContainerMetadatum\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteContainerMetadatum\` mutation."""
input DeleteContainerMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!
}

"""The output of our delete \`WasmMetadatum\` mutation."""
type DeleteWasmMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WasmMetadatum\` that was deleted by this mutation."""
  wasmMetadatum: WasmMetadatum
  deletedWasmMetadatumId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WasmMetadatum\`. May be used by Relay 1."""
  wasmMetadatumEdge(
    """The method to use when ordering \`WasmMetadatum\`."""
    orderBy: [WasmMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WasmMetadatumEdge
}

"""All input for the \`deleteWasmMetadatumById\` mutation."""
input DeleteWasmMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`WasmMetadatum\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteWasmMetadatum\` mutation."""
input DeleteWasmMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!
}

"""The output of our delete \`Tag\` mutation."""
type DeleteTagPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Tag\` that was deleted by this mutation."""
  tag: Tag
  deletedTagId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Tag\`. May be used by Relay 1."""
  tagEdge(
    """The method to use when ordering \`Tag\`."""
    orderBy: [TagOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TagEdge
}

"""All input for the \`deleteTagById\` mutation."""
input DeleteTagByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Tag\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteTag\` mutation."""
input DeleteTagInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`UploadSession\` mutation."""
type DeleteUploadSessionPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`UploadSession\` that was deleted by this mutation."""
  uploadSession: UploadSession
  deletedUploadSessionId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`UploadSession\`. May be used by Relay 1."""
  uploadSessionEdge(
    """The method to use when ordering \`UploadSession\`."""
    orderBy: [UploadSessionOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UploadSessionEdge
}

"""All input for the \`deleteUploadSessionById\` mutation."""
input DeleteUploadSessionByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`UploadSession\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteUploadSession\` mutation."""
input DeleteUploadSessionInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Artifact\` mutation."""
type DeleteArtifactPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Artifact\` that was deleted by this mutation."""
  artifact: Artifact
  deletedArtifactId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Artifact\`. May be used by Relay 1."""
  artifactEdge(
    """The method to use when ordering \`Artifact\`."""
    orderBy: [ArtifactOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ArtifactEdge
}

"""All input for the \`deleteArtifactById\` mutation."""
input DeleteArtifactByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Artifact\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteArtifact\` mutation."""
input DeleteArtifactInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`SchemaMetadatum\` mutation."""
type DeleteSchemaMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`SchemaMetadatum\` that was deleted by this mutation."""
  schemaMetadatum: SchemaMetadatum
  deletedSchemaMetadatumId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`SchemaMetadatum\`. May be used by Relay 1."""
  schemaMetadatumEdge(
    """The method to use when ordering \`SchemaMetadatum\`."""
    orderBy: [SchemaMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): SchemaMetadatumEdge
}

"""All input for the \`deleteSchemaMetadatumById\` mutation."""
input DeleteSchemaMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`SchemaMetadatum\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteSchemaMetadatum\` mutation."""
input DeleteSchemaMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  artifactId: UUID!
}

"""The output of our delete \`Namespace\` mutation."""
type DeleteNamespacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Namespace\` that was deleted by this mutation."""
  namespace: Namespace
  deletedNamespaceId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Namespace\`. May be used by Relay 1."""
  namespaceEdge(
    """The method to use when ordering \`Namespace\`."""
    orderBy: [NamespaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): NamespaceEdge
}

"""All input for the \`deleteNamespaceById\` mutation."""
input DeleteNamespaceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Namespace\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteNamespace\` mutation."""
input DeleteNamespaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""All input for the \`deleteNamespaceByName\` mutation."""
input DeleteNamespaceByNameInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  name: String!
}

"""The output of our delete \`Repository\` mutation."""
type DeleteRepositoryPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Repository\` that was deleted by this mutation."""
  repository: Repository
  deletedRepositoryId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Repository\`. May be used by Relay 1."""
  repositoryEdge(
    """The method to use when ordering \`Repository\`."""
    orderBy: [RepositoryOrderBy!]! = [PRIMARY_KEY_ASC]
  ): RepositoryEdge
}

"""All input for the \`deleteRepositoryById\` mutation."""
input DeleteRepositoryByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Repository\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteRepository\` mutation."""
input DeleteRepositoryInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`FederatedSource\` mutation."""
type DeleteFederatedSourcePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSource\` that was deleted by this mutation."""
  federatedSource: FederatedSource
  deletedFederatedSourceId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSource\`. May be used by Relay 1."""
  federatedSourceEdge(
    """The method to use when ordering \`FederatedSource\`."""
    orderBy: [FederatedSourceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSourceEdge
}

"""All input for the \`deleteFederatedSourceById\` mutation."""
input DeleteFederatedSourceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`FederatedSource\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteFederatedSource\` mutation."""
input DeleteFederatedSourceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""All input for the \`deleteFederatedSourceByNamespace\` mutation."""
input DeleteFederatedSourceByNamespaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  namespace: String!
}

"""The output of our delete \`FederatedSkillCache\` mutation."""
type DeleteFederatedSkillCachePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`FederatedSkillCache\` that was deleted by this mutation."""
  federatedSkillCache: FederatedSkillCache
  deletedFederatedSkillCacheId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`FederatedSkillCache\`. May be used by Relay 1."""
  federatedSkillCacheEdge(
    """The method to use when ordering \`FederatedSkillCache\`."""
    orderBy: [FederatedSkillCacheOrderBy!]! = [PRIMARY_KEY_ASC]
  ): FederatedSkillCacheEdge
}

"""All input for the \`deleteFederatedSkillCacheById\` mutation."""
input DeleteFederatedSkillCacheByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`FederatedSkillCache\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteFederatedSkillCache\` mutation."""
input DeleteFederatedSkillCacheInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`CargoMetadatum\` mutation."""
type DeleteCargoMetadatumPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`CargoMetadatum\` that was deleted by this mutation."""
  cargoMetadatum: CargoMetadatum
  deletedCargoMetadatumId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`CargoMetadatum\`. May be used by Relay 1."""
  cargoMetadatumEdge(
    """The method to use when ordering \`CargoMetadatum\`."""
    orderBy: [CargoMetadatumOrderBy!]! = [PRIMARY_KEY_ASC]
  ): CargoMetadatumEdge
}

"""All input for the \`deleteCargoMetadatumById\` mutation."""
input DeleteCargoMetadatumByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`CargoMetadatum\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteCargoMetadatum\` mutation."""
input DeleteCargoMetadatumInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`ApiToken\` mutation."""
type DeleteApiTokenPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ApiToken\` that was deleted by this mutation."""
  apiToken: ApiToken
  deletedApiTokenId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ApiToken\`. May be used by Relay 1."""
  apiTokenEdge(
    """The method to use when ordering \`ApiToken\`."""
    orderBy: [ApiTokenOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ApiTokenEdge
}

"""All input for the \`deleteApiTokenById\` mutation."""
input DeleteApiTokenByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ApiToken\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteApiToken\` mutation."""
input DeleteApiTokenInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}`;
export const objects = {
  Query: {
    assertStep() {
      return !0;
    },
    plans: {
      apiToken(_$root, {
        $rowId
      }) {
        return resource_api_tokenPgResource.get({
          id: $rowId
        });
      },
      apiTokenById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_ApiToken($nodeId);
      },
      apiTokens: {
        plan() {
          return connection(resource_api_tokenPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed12(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      artifact(_$root, {
        $rowId
      }) {
        return resource_artifactPgResource.get({
          id: $rowId
        });
      },
      artifactById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_Artifact($nodeId);
      },
      artifacts: {
        plan() {
          return connection(resource_artifactPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed5(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      cargoMetadata: {
        plan() {
          return connection(resource_cargo_metadataPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed11(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      cargoMetadatum(_$root, {
        $rowId
      }) {
        return resource_cargo_metadataPgResource.get({
          id: $rowId
        });
      },
      cargoMetadatumById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_CargoMetadatum($nodeId);
      },
      containerMetadata: {
        plan() {
          return connection(resource_container_metadataPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      containerMetadatum(_$root, {
        $artifactId
      }) {
        return resource_container_metadataPgResource.get({
          artifact_id: $artifactId
        });
      },
      containerMetadatumById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_ContainerMetadatum($nodeId);
      },
      federatedSkillCache(_$root, {
        $rowId
      }) {
        return resource_federated_skill_cachePgResource.get({
          id: $rowId
        });
      },
      federatedSkillCacheById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_FederatedSkillCache($nodeId);
      },
      federatedSkillCaches: {
        plan() {
          return connection(resource_federated_skill_cachePgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed10(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      federatedSource(_$root, {
        $rowId
      }) {
        return resource_federated_sourcePgResource.get({
          id: $rowId
        });
      },
      federatedSourceById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_FederatedSource($nodeId);
      },
      federatedSourceByNamespace(_$root, {
        $namespace
      }) {
        return resource_federated_sourcePgResource.get({
          namespace: $namespace
        });
      },
      federatedSources: {
        plan() {
          return connection(resource_federated_sourcePgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed9(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      id($parent) {
        const specifier = nodeIdHandler_Query.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_Query.codec.name].encode);
      },
      namespace(_$root, {
        $rowId
      }) {
        return resource_namespacePgResource.get({
          id: $rowId
        });
      },
      namespaceById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_Namespace($nodeId);
      },
      namespaceByName(_$root, {
        $name
      }) {
        return resource_namespacePgResource.get({
          name: $name
        });
      },
      namespaces: {
        plan() {
          return connection(resource_namespacePgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed7(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      node(_$root, fieldArgs) {
        return fieldArgs.getRaw("id");
      },
      query() {
        return rootValue();
      },
      repositories: {
        plan() {
          return connection(resource_repositoryPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed8(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      repository(_$root, {
        $rowId
      }) {
        return resource_repositoryPgResource.get({
          id: $rowId
        });
      },
      repositoryById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_Repository($nodeId);
      },
      schemaMetadata: {
        plan() {
          return connection(resource_schema_metadataPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed6(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      schemaMetadatum(_$root, {
        $artifactId
      }) {
        return resource_schema_metadataPgResource.get({
          artifact_id: $artifactId
        });
      },
      schemaMetadatumById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_SchemaMetadatum($nodeId);
      },
      tag(_$root, {
        $rowId
      }) {
        return resource_tagPgResource.get({
          id: $rowId
        });
      },
      tagById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_Tag($nodeId);
      },
      tags: {
        plan() {
          return connection(resource_tagPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed3(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      uploadSession(_$root, {
        $rowId
      }) {
        return resource_upload_sessionPgResource.get({
          id: $rowId
        });
      },
      uploadSessionById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_UploadSession($nodeId);
      },
      uploadSessions: {
        plan() {
          return connection(resource_upload_sessionPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed4(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      wasmMetadata: {
        plan() {
          return connection(resource_wasm_metadataPgResource.find());
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed2(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      wasmMetadatum(_$root, {
        $artifactId
      }) {
        return resource_wasm_metadataPgResource.get({
          artifact_id: $artifactId
        });
      },
      wasmMetadatumById(_$parent, args) {
        const $nodeId = args.getRaw("id");
        return nodeFetcher_WasmMetadatum($nodeId);
      }
    }
  },
  Mutation: {
    assertStep: __ValueStep,
    plans: {
      createApiToken: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_api_tokenPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createArtifact: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_artifactPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createCargoMetadatum: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_cargo_metadataPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createContainerMetadatum: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_container_metadataPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createFederatedSkillCache: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_federated_skill_cachePgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createFederatedSource: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_federated_sourcePgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createNamespace: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_namespacePgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createRepository: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_repositoryPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createSchemaMetadatum: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_schema_metadataPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createTag: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_tagPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createUploadSession: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_upload_sessionPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      createWasmMetadatum: {
        plan(_, args) {
          const $insert = pgInsertSingle(resource_wasm_metadataPgResource, Object.create(null));
          args.apply($insert);
          return object({
            result: $insert
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteApiToken: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_api_tokenPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteApiTokenById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_api_tokenPgResource, specFromArgs_ApiToken2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteArtifact: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_artifactPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteArtifactById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_artifactPgResource, specFromArgs_Artifact2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteCargoMetadatum: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_cargo_metadataPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteCargoMetadatumById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_cargo_metadataPgResource, specFromArgs_CargoMetadatum2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteContainerMetadatum: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_container_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteContainerMetadatumById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_container_metadataPgResource, specFromArgs_ContainerMetadatum2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteFederatedSkillCache: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_federated_skill_cachePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteFederatedSkillCacheById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_federated_skill_cachePgResource, specFromArgs_FederatedSkillCache2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteFederatedSource: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_federated_sourcePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteFederatedSourceById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_federated_sourcePgResource, specFromArgs_FederatedSource2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteFederatedSourceByNamespace: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_federated_sourcePgResource, {
            namespace: args.getRaw(['input', "namespace"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteNamespace: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_namespacePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteNamespaceById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_namespacePgResource, specFromArgs_Namespace2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteNamespaceByName: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_namespacePgResource, {
            name: args.getRaw(['input', "name"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteRepository: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_repositoryPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteRepositoryById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_repositoryPgResource, specFromArgs_Repository2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteSchemaMetadatum: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_schema_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteSchemaMetadatumById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_schema_metadataPgResource, specFromArgs_SchemaMetadatum2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteTag: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_tagPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteTagById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_tagPgResource, specFromArgs_Tag2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteUploadSession: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_upload_sessionPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteUploadSessionById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_upload_sessionPgResource, specFromArgs_UploadSession2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteWasmMetadatum: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_wasm_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      deleteWasmMetadatumById: {
        plan(_$root, args) {
          const $delete = pgDeleteSingle(resource_wasm_metadataPgResource, specFromArgs_WasmMetadatum2(args));
          args.apply($delete);
          return object({
            result: $delete
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateApiToken: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_api_tokenPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateApiTokenById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_api_tokenPgResource, specFromArgs_ApiToken(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateArtifact: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_artifactPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateArtifactById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_artifactPgResource, specFromArgs_Artifact(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateCargoMetadatum: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_cargo_metadataPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateCargoMetadatumById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_cargo_metadataPgResource, specFromArgs_CargoMetadatum(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateContainerMetadatum: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_container_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateContainerMetadatumById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_container_metadataPgResource, specFromArgs_ContainerMetadatum(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateFederatedSkillCache: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_federated_skill_cachePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateFederatedSkillCacheById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_federated_skill_cachePgResource, specFromArgs_FederatedSkillCache(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateFederatedSource: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_federated_sourcePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateFederatedSourceById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_federated_sourcePgResource, specFromArgs_FederatedSource(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateFederatedSourceByNamespace: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_federated_sourcePgResource, {
            namespace: args.getRaw(['input', "namespace"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateNamespace: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_namespacePgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateNamespaceById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_namespacePgResource, specFromArgs_Namespace(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateNamespaceByName: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_namespacePgResource, {
            name: args.getRaw(['input', "name"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateRepository: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_repositoryPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateRepositoryById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_repositoryPgResource, specFromArgs_Repository(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateSchemaMetadatum: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_schema_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateSchemaMetadatumById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_schema_metadataPgResource, specFromArgs_SchemaMetadatum(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateTag: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_tagPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateTagById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_tagPgResource, specFromArgs_Tag(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateUploadSession: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_upload_sessionPgResource, {
            id: args.getRaw(['input', "rowId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateUploadSessionById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_upload_sessionPgResource, specFromArgs_UploadSession(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateWasmMetadatum: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_wasm_metadataPgResource, {
            artifact_id: args.getRaw(['input', "artifactId"])
          });
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      },
      updateWasmMetadatumById: {
        plan(_$root, args) {
          const $update = pgUpdateSingle(resource_wasm_metadataPgResource, specFromArgs_WasmMetadatum(args));
          args.apply($update);
          return object({
            result: $update
          });
        },
        args: {
          input(_, $object) {
            return $object;
          }
        }
      }
    }
  },
  ApiToken: {
    assertStep: assertPgClassSingleStep,
    plans: {
      createdAt($record) {
        return $record.get("created_at");
      },
      createdBy($record) {
        return $record.get("created_by");
      },
      expiresAt($record) {
        return $record.get("expires_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_ApiToken.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_ApiToken.codec.name].encode);
      },
      isActive($record) {
        return $record.get("is_active");
      },
      lastUsedAt($record) {
        return $record.get("last_used_at");
      },
      namespace($record) {
        return resource_namespacePgResource.get({
          id: $record.get("namespace_id")
        });
      },
      namespaceId($record) {
        return $record.get("namespace_id");
      },
      repository($record) {
        return resource_repositoryPgResource.get({
          id: $record.get("repository_id")
        });
      },
      repositoryId($record) {
        return $record.get("repository_id");
      },
      rowId($record) {
        return $record.get("id");
      },
      tokenHash($record) {
        return $record.get("token_hash");
      },
      tokenPrefix($record) {
        return $record.get("token_prefix");
      },
      updatedAt($record) {
        return $record.get("updated_at");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of api_tokenUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_api_tokenPgResource.get(spec);
    }
  },
  ApiTokenConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  Artifact: {
    assertStep: assertPgClassSingleStep,
    plans: {
      cargoMetadata: {
        plan($record) {
          const $records = resource_cargo_metadataPgResource.find({
            artifact_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed14(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      containerMetadatum($record) {
        return resource_container_metadataPgResource.get({
          artifact_id: $record.get("id")
        });
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_Artifact.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_Artifact.codec.name].encode);
      },
      mediaType($record) {
        return $record.get("media_type");
      },
      repository($record) {
        return resource_repositoryPgResource.get({
          id: $record.get("repository_id")
        });
      },
      repositoryId($record) {
        return $record.get("repository_id");
      },
      rowId($record) {
        return $record.get("id");
      },
      schemaMetadatum($record) {
        return resource_schema_metadataPgResource.get({
          artifact_id: $record.get("id")
        });
      },
      storagePath($record) {
        return $record.get("storage_path");
      },
      tags: {
        plan($record) {
          const $records = resource_tagPgResource.find({
            artifact_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed13(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      wasmMetadatum($record) {
        return resource_wasm_metadataPgResource.get({
          artifact_id: $record.get("id")
        });
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of artifactUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_artifactPgResource.get(spec);
    }
  },
  ArtifactConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  CargoMetadatum: {
    assertStep: assertPgClassSingleStep,
    plans: {
      artifact($record) {
        return resource_artifactPgResource.get({
          id: $record.get("artifact_id")
        });
      },
      artifactId($record) {
        return $record.get("artifact_id");
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_CargoMetadatum.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_CargoMetadatum.codec.name].encode);
      },
      rowId($record) {
        return $record.get("id");
      },
      rustVersion($record) {
        return $record.get("rust_version");
      },
      updatedAt($record) {
        return $record.get("updated_at");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of cargo_metadataUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_cargo_metadataPgResource.get(spec);
    }
  },
  CargoMetadatumConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  ContainerMetadatum: {
    assertStep: assertPgClassSingleStep,
    plans: {
      artifact($record) {
        return resource_artifactPgResource.get({
          id: $record.get("artifact_id")
        });
      },
      artifactId($record) {
        return $record.get("artifact_id");
      },
      configDigest($record) {
        return $record.get("config_digest");
      },
      id($parent) {
        const specifier = nodeIdHandler_ContainerMetadatum.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_ContainerMetadatum.codec.name].encode);
      },
      layerDigests($record) {
        return $record.get("layer_digests");
      },
      schemaVersion($record) {
        return $record.get("schema_version");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of container_metadataUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_container_metadataPgResource.get(spec);
    }
  },
  ContainerMetadatumConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  CreateApiTokenPayload: {
    assertStep: assertExecutableStep,
    plans: {
      apiToken($object) {
        return $object.get("result");
      },
      apiTokenEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_api_tokenPgResource, api_tokenUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateArtifactPayload: {
    assertStep: assertExecutableStep,
    plans: {
      artifact($object) {
        return $object.get("result");
      },
      artifactEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_artifactPgResource, artifactUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateCargoMetadatumPayload: {
    assertStep: assertExecutableStep,
    plans: {
      cargoMetadatum($object) {
        return $object.get("result");
      },
      cargoMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_cargo_metadataPgResource, cargo_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateContainerMetadatumPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      containerMetadatum($object) {
        return $object.get("result");
      },
      containerMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_container_metadataPgResource, container_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateFederatedSkillCachePayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      federatedSkillCache($object) {
        return $object.get("result");
      },
      federatedSkillCacheEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_skill_cachePgResource, federated_skill_cacheUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateFederatedSourcePayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      federatedSource($object) {
        return $object.get("result");
      },
      federatedSourceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_sourcePgResource, federated_sourceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateNamespacePayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      namespace($object) {
        return $object.get("result");
      },
      namespaceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_namespacePgResource, namespaceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  CreateRepositoryPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      repository($object) {
        return $object.get("result");
      },
      repositoryEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_repositoryPgResource, repositoryUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  CreateSchemaMetadatumPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      schemaMetadatum($object) {
        return $object.get("result");
      },
      schemaMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_schema_metadataPgResource, schema_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  CreateTagPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      tag($object) {
        return $object.get("result");
      },
      tagEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_tagPgResource, tagUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  CreateUploadSessionPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      uploadSession($object) {
        return $object.get("result");
      },
      uploadSessionEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_upload_sessionPgResource, upload_sessionUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  CreateWasmMetadatumPayload: {
    assertStep: assertExecutableStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      wasmMetadatum($object) {
        return $object.get("result");
      },
      wasmMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_wasm_metadataPgResource, wasm_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  DeleteApiTokenPayload: {
    assertStep: ObjectStep,
    plans: {
      apiToken($object) {
        return $object.get("result");
      },
      apiTokenEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_api_tokenPgResource, api_tokenUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedApiTokenId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_ApiToken.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteArtifactPayload: {
    assertStep: ObjectStep,
    plans: {
      artifact($object) {
        return $object.get("result");
      },
      artifactEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_artifactPgResource, artifactUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedArtifactId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_Artifact.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteCargoMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      cargoMetadatum($object) {
        return $object.get("result");
      },
      cargoMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_cargo_metadataPgResource, cargo_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedCargoMetadatumId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_CargoMetadatum.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteContainerMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      containerMetadatum($object) {
        return $object.get("result");
      },
      containerMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_container_metadataPgResource, container_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      deletedContainerMetadatumId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_ContainerMetadatum.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteFederatedSkillCachePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedFederatedSkillCacheId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_FederatedSkillCache.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      federatedSkillCache($object) {
        return $object.get("result");
      },
      federatedSkillCacheEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_skill_cachePgResource, federated_skill_cacheUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteFederatedSourcePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedFederatedSourceId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_FederatedSource.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      federatedSource($object) {
        return $object.get("result");
      },
      federatedSourceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_sourcePgResource, federated_sourceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteNamespacePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedNamespaceId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_Namespace.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      namespace($object) {
        return $object.get("result");
      },
      namespaceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_namespacePgResource, namespaceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  DeleteRepositoryPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedRepositoryId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_Repository.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      },
      repository($object) {
        return $object.get("result");
      },
      repositoryEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_repositoryPgResource, repositoryUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  DeleteSchemaMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedSchemaMetadatumId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_SchemaMetadatum.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      },
      schemaMetadatum($object) {
        return $object.get("result");
      },
      schemaMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_schema_metadataPgResource, schema_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  DeleteTagPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedTagId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_Tag.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      },
      tag($object) {
        return $object.get("result");
      },
      tagEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_tagPgResource, tagUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  DeleteUploadSessionPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedUploadSessionId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_UploadSession.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      },
      uploadSession($object) {
        return $object.get("result");
      },
      uploadSessionEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_upload_sessionPgResource, upload_sessionUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  DeleteWasmMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      deletedWasmMetadatumId($object) {
        const $record = $object.getStepForKey("result"),
          specifier = nodeIdHandler_WasmMetadatum.plan($record);
        return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
      },
      query() {
        return rootValue();
      },
      wasmMetadatum($object) {
        return $object.get("result");
      },
      wasmMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_wasm_metadataPgResource, wasm_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  FederatedSkillCache: {
    assertStep: assertPgClassSingleStep,
    plans: {
      contentDigest($record) {
        return $record.get("content_digest");
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      expiresAt($record) {
        return $record.get("expires_at");
      },
      fetchedAt($record) {
        return $record.get("fetched_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_FederatedSkillCache.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_FederatedSkillCache.codec.name].encode);
      },
      rowId($record) {
        return $record.get("id");
      },
      source($record) {
        return resource_federated_sourcePgResource.get({
          id: $record.get("source_id")
        });
      },
      sourceId($record) {
        return $record.get("source_id");
      },
      upstreamMeta($record) {
        return $record.get("upstream_meta");
      },
      vetReason($record) {
        return $record.get("vet_reason");
      },
      vetStatus($record) {
        return $record.get("vet_status");
      },
      vettedAt($record) {
        return $record.get("vetted_at");
      },
      vettedBy($record) {
        return $record.get("vetted_by");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of federated_skill_cacheUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_federated_skill_cachePgResource.get(spec);
    }
  },
  FederatedSkillCacheConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  FederatedSource: {
    assertStep: assertPgClassSingleStep,
    plans: {
      cacheTtlSeconds($record) {
        return $record.get("cache_ttl_seconds");
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      federatedSkillCachesBySourceId: {
        plan($record) {
          const $records = resource_federated_skill_cachePgResource.find({
            source_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed51(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      id($parent) {
        const specifier = nodeIdHandler_FederatedSource.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_FederatedSource.codec.name].encode);
      },
      rateLimitRpm($record) {
        return $record.get("rate_limit_rpm");
      },
      requireVetting($record) {
        return $record.get("require_vetting");
      },
      rowId($record) {
        return $record.get("id");
      },
      tagListCacheTtlSeconds($record) {
        return $record.get("tag_list_cache_ttl_seconds");
      },
      updatedAt($record) {
        return $record.get("updated_at");
      },
      upstreamBaseUrl($record) {
        return $record.get("upstream_base_url");
      },
      upstreamType($record) {
        return $record.get("upstream_type");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of federated_sourceUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_federated_sourcePgResource.get(spec);
    }
  },
  FederatedSourceConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  Namespace: {
    assertStep: assertPgClassSingleStep,
    plans: {
      apiTokens: {
        plan($record) {
          const $records = resource_api_tokenPgResource.find({
            namespace_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed20(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_Namespace.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_Namespace.codec.name].encode);
      },
      organizationId($record) {
        return $record.get("organization_id");
      },
      repositories: {
        plan($record) {
          const $records = resource_repositoryPgResource.find({
            namespace_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed19(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      rowId($record) {
        return $record.get("id");
      },
      updatedAt($record) {
        return $record.get("updated_at");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of namespaceUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_namespacePgResource.get(spec);
    }
  },
  NamespaceConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  Repository: {
    assertStep: assertPgClassSingleStep,
    plans: {
      apiTokens: {
        plan($record) {
          const $records = resource_api_tokenPgResource.find({
            repository_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed18(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      artifacts: {
        plan($record) {
          const $records = resource_artifactPgResource.find({
            repository_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed15(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      artifactType($record) {
        return $record.get("artifact_type");
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_Repository.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_Repository.codec.name].encode);
      },
      isPublic($record) {
        return $record.get("is_public");
      },
      namespace($record) {
        return resource_namespacePgResource.get({
          id: $record.get("namespace_id")
        });
      },
      namespaceId($record) {
        return $record.get("namespace_id");
      },
      rowId($record) {
        return $record.get("id");
      },
      tags: {
        plan($record) {
          const $records = resource_tagPgResource.find({
            repository_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed16(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      },
      updatedAt($record) {
        return $record.get("updated_at");
      },
      uploadSessions: {
        plan($record) {
          const $records = resource_upload_sessionPgResource.find({
            repository_id: $record.get("id")
          });
          return connection($records);
        },
        args: {
          first(_, $connection, arg) {
            $connection.setFirst(arg.getRaw());
          },
          last(_, $connection, val) {
            $connection.setLast(val.getRaw());
          },
          offset(_, $connection, val) {
            $connection.setOffset(val.getRaw());
          },
          before(_, $connection, val) {
            $connection.setBefore(val.getRaw());
          },
          after(_, $connection, val) {
            $connection.setAfter(val.getRaw());
          },
          condition(_condition, $connection, arg) {
            const $select = $connection.getSubplan();
            arg.apply($select, qbWhereBuilder);
          },
          filter(_, $connection, fieldArg) {
            const $pgSelect = $connection.getSubplan();
            fieldArg.apply($pgSelect, (queryBuilder, value) => {
              assertAllowed17(value, "object");
              if (value == null) return;
              const condition = new PgCondition(queryBuilder);
              return condition;
            });
          },
          orderBy(parent, $connection, value) {
            const $select = $connection.getSubplan();
            value.apply($select);
          }
        }
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of repositoryUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_repositoryPgResource.get(spec);
    }
  },
  RepositoryConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  SchemaMetadatum: {
    assertStep: assertPgClassSingleStep,
    plans: {
      artifact($record) {
        return resource_artifactPgResource.get({
          id: $record.get("artifact_id")
        });
      },
      artifactId($record) {
        return $record.get("artifact_id");
      },
      id($parent) {
        const specifier = nodeIdHandler_SchemaMetadatum.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_SchemaMetadatum.codec.name].encode);
      },
      isValid($record) {
        return $record.get("is_valid");
      },
      validationErrors($record) {
        return $record.get("validation_errors");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of schema_metadataUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_schema_metadataPgResource.get(spec);
    }
  },
  SchemaMetadatumConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  Tag: {
    assertStep: assertPgClassSingleStep,
    plans: {
      artifact($record) {
        return resource_artifactPgResource.get({
          id: $record.get("artifact_id")
        });
      },
      artifactId($record) {
        return $record.get("artifact_id");
      },
      createdAt($record) {
        return $record.get("created_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_Tag.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_Tag.codec.name].encode);
      },
      repository($record) {
        return resource_repositoryPgResource.get({
          id: $record.get("repository_id")
        });
      },
      repositoryId($record) {
        return $record.get("repository_id");
      },
      rowId($record) {
        return $record.get("id");
      },
      updatedAt($record) {
        return $record.get("updated_at");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of tagUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_tagPgResource.get(spec);
    }
  },
  TagConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  UpdateApiTokenPayload: {
    assertStep: ObjectStep,
    plans: {
      apiToken($object) {
        return $object.get("result");
      },
      apiTokenEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_api_tokenPgResource, api_tokenUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateArtifactPayload: {
    assertStep: ObjectStep,
    plans: {
      artifact($object) {
        return $object.get("result");
      },
      artifactEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_artifactPgResource, artifactUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateCargoMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      cargoMetadatum($object) {
        return $object.get("result");
      },
      cargoMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_cargo_metadataPgResource, cargo_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateContainerMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      containerMetadatum($object) {
        return $object.get("result");
      },
      containerMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_container_metadataPgResource, container_metadataUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateFederatedSkillCachePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      federatedSkillCache($object) {
        return $object.get("result");
      },
      federatedSkillCacheEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_skill_cachePgResource, federated_skill_cacheUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateFederatedSourcePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      federatedSource($object) {
        return $object.get("result");
      },
      federatedSourceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_federated_sourcePgResource, federated_sourceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateNamespacePayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      namespace($object) {
        return $object.get("result");
      },
      namespaceEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_namespacePgResource, namespaceUniques[0].attributes, $mutation, fieldArgs);
      },
      query() {
        return rootValue();
      }
    }
  },
  UpdateRepositoryPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      repository($object) {
        return $object.get("result");
      },
      repositoryEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_repositoryPgResource, repositoryUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  UpdateSchemaMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      schemaMetadatum($object) {
        return $object.get("result");
      },
      schemaMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_schema_metadataPgResource, schema_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  UpdateTagPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      tag($object) {
        return $object.get("result");
      },
      tagEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_tagPgResource, tagUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  UpdateUploadSessionPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      uploadSession($object) {
        return $object.get("result");
      },
      uploadSessionEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_upload_sessionPgResource, upload_sessionUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  UpdateWasmMetadatumPayload: {
    assertStep: ObjectStep,
    plans: {
      clientMutationId($mutation) {
        return $mutation.getStepForKey("result").getMeta("clientMutationId");
      },
      query() {
        return rootValue();
      },
      wasmMetadatum($object) {
        return $object.get("result");
      },
      wasmMetadatumEdge($mutation, fieldArgs) {
        return pgMutationPayloadEdge(resource_wasm_metadataPgResource, wasm_metadataUniques[0].attributes, $mutation, fieldArgs);
      }
    }
  },
  UploadSession: {
    assertStep: assertPgClassSingleStep,
    plans: {
      createdAt($record) {
        return $record.get("created_at");
      },
      expiresAt($record) {
        return $record.get("expires_at");
      },
      id($parent) {
        const specifier = nodeIdHandler_UploadSession.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_UploadSession.codec.name].encode);
      },
      repository($record) {
        return resource_repositoryPgResource.get({
          id: $record.get("repository_id")
        });
      },
      repositoryId($record) {
        return $record.get("repository_id");
      },
      rowId($record) {
        return $record.get("id");
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of upload_sessionUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_upload_sessionPgResource.get(spec);
    }
  },
  UploadSessionConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  },
  WasmMetadatum: {
    assertStep: assertPgClassSingleStep,
    plans: {
      artifact($record) {
        return resource_artifactPgResource.get({
          id: $record.get("artifact_id")
        });
      },
      artifactId($record) {
        return $record.get("artifact_id");
      },
      id($parent) {
        const specifier = nodeIdHandler_WasmMetadatum.plan($parent);
        return lambda(specifier, nodeIdCodecs[nodeIdHandler_WasmMetadatum.codec.name].encode);
      }
    },
    planType($specifier) {
      const spec = Object.create(null);
      for (const pkCol of wasm_metadataUniques[0].attributes) spec[pkCol] = get2($specifier, pkCol);
      return resource_wasm_metadataPgResource.get(spec);
    }
  },
  WasmMetadatumConnection: {
    assertStep: ConnectionStep,
    plans: {
      totalCount($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
      }
    }
  }
};
export const interfaces = {
  Node: {
    planType($nodeId) {
      const $specifier = decodeNodeId($nodeId);
      return {
        $__typename: lambda($specifier, findTypeNameMatch, !0),
        planForType(type) {
          const spec = nodeIdHandlerByTypeName[type.name];
          if (spec) return spec.get(spec.getSpec(access($specifier, [spec.codec.name])));else throw Error(`Failed to find handler for ${type.name}`);
        }
      };
    }
  }
};
export const inputObjects = {
  ApiTokenCondition: {
    plans: {
      createdBy($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "created_by",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      isActive($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "is_active",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.boolean)}`;
          }
        });
      },
      namespaceId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "namespace_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      repositoryId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "repository_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      tokenHash($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "token_hash",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      tokenPrefix($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "token_prefix",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      }
    }
  },
  ApiTokenFilter: {
    plans: {
      and($where, value) {
        assertAllowed46(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      createdBy(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec27;
        return condition;
      },
      isActive(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec28;
        return condition;
      },
      namespace($where, value) {
        assertAllowed45(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: namespaceIdentifier,
          alias: resource_namespacePgResource.name
        });
        registryConfig.pgRelations.apiToken.namespaceByMyNamespaceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.apiToken.namespaceByMyNamespaceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      namespaceId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec25;
        return condition;
      },
      not($where, value) {
        assertAllowed46(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed46(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      repository($where, value) {
        assertAllowed45(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name
        });
        registryConfig.pgRelations.apiToken.repositoryByMyRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.apiToken.repositoryByMyRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      repositoryExists($where, value) {
        assertAllowed45(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.apiToken.repositoryByMyRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.apiToken.repositoryByMyRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      repositoryId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec26;
        return condition;
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec22;
        return condition;
      },
      tokenHash(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec23;
        return condition;
      },
      tokenPrefix(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec24;
        return condition;
      }
    }
  },
  ApiTokenInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      createdBy(obj, val, {
        field,
        schema
      }) {
        obj.set("created_by", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      isActive(obj, val, {
        field,
        schema
      }) {
        obj.set("is_active", bakedInputRuntime(schema, field.type, val));
      },
      lastUsedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("last_used_at", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      namespaceId(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace_id", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      scope(obj, val, {
        field,
        schema
      }) {
        obj.set("scope", bakedInputRuntime(schema, field.type, val));
      },
      tokenHash(obj, val, {
        field,
        schema
      }) {
        obj.set("token_hash", bakedInputRuntime(schema, field.type, val));
      },
      tokenPrefix(obj, val, {
        field,
        schema
      }) {
        obj.set("token_prefix", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ApiTokenPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      createdBy(obj, val, {
        field,
        schema
      }) {
        obj.set("created_by", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      isActive(obj, val, {
        field,
        schema
      }) {
        obj.set("is_active", bakedInputRuntime(schema, field.type, val));
      },
      lastUsedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("last_used_at", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      namespaceId(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace_id", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      scope(obj, val, {
        field,
        schema
      }) {
        obj.set("scope", bakedInputRuntime(schema, field.type, val));
      },
      tokenHash(obj, val, {
        field,
        schema
      }) {
        obj.set("token_hash", bakedInputRuntime(schema, field.type, val));
      },
      tokenPrefix(obj, val, {
        field,
        schema
      }) {
        obj.set("token_prefix", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ArtifactCondition: {
    plans: {
      digest($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "digest",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      repositoryId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "repository_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  ArtifactFilter: {
    plans: {
      and($where, value) {
        assertAllowed27(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      cargoMetadata($where, value) {
        assertAllowed25(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: cargoMetadataIdentifier,
          alias: resource_cargo_metadataPgResource.name,
          localAttributes: registryConfig.pgRelations.artifact.cargoMetadataByTheirArtifactId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.artifact.cargoMetadataByTheirArtifactId.remoteAttributes
        };
        return $rel;
      },
      cargoMetadataExist($where, value) {
        assertAllowed25(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: cargoMetadataIdentifier,
          alias: resource_cargo_metadataPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.artifact.cargoMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.cargoMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      containerMetadatum($where, value) {
        assertAllowed25(value, "object");
        const $subQuery = $where.existsPlan({
          tableExpression: containerMetadataIdentifier,
          alias: resource_container_metadataPgResource.name
        });
        registryConfig.pgRelations.artifact.containerMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.containerMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      containerMetadatumExists($where, value) {
        assertAllowed25(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: containerMetadataIdentifier,
          alias: resource_container_metadataPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.artifact.containerMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.containerMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      digest(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec7;
        return condition;
      },
      not($where, value) {
        assertAllowed27(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed27(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      repository($where, value) {
        assertAllowed26(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name
        });
        registryConfig.pgRelations.artifact.repositoryByMyRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.repositoryByMyRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      repositoryId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec6;
        return condition;
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec5;
        return condition;
      },
      schemaMetadatum($where, value) {
        assertAllowed25(value, "object");
        const $subQuery = $where.existsPlan({
          tableExpression: schemaMetadataIdentifier,
          alias: resource_schema_metadataPgResource.name
        });
        registryConfig.pgRelations.artifact.schemaMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.schemaMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      schemaMetadatumExists($where, value) {
        assertAllowed25(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: schemaMetadataIdentifier,
          alias: resource_schema_metadataPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.artifact.schemaMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.schemaMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      tags($where, value) {
        assertAllowed25(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: tagIdentifier,
          alias: resource_tagPgResource.name,
          localAttributes: registryConfig.pgRelations.artifact.tagsByTheirArtifactId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.artifact.tagsByTheirArtifactId.remoteAttributes
        };
        return $rel;
      },
      tagsExist($where, value) {
        assertAllowed25(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: tagIdentifier,
          alias: resource_tagPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.artifact.tagsByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.tagsByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      wasmMetadatum($where, value) {
        assertAllowed25(value, "object");
        const $subQuery = $where.existsPlan({
          tableExpression: wasmMetadataIdentifier,
          alias: resource_wasm_metadataPgResource.name
        });
        registryConfig.pgRelations.artifact.wasmMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.wasmMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      wasmMetadatumExists($where, value) {
        assertAllowed25(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: wasmMetadataIdentifier,
          alias: resource_wasm_metadataPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.artifact.wasmMetadataByTheirArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.artifact.wasmMetadataByTheirArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      }
    }
  },
  ArtifactInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      content(obj, val, {
        field,
        schema
      }) {
        obj.set("content", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      digest(obj, val, {
        field,
        schema
      }) {
        obj.set("digest", bakedInputRuntime(schema, field.type, val));
      },
      mediaType(obj, val, {
        field,
        schema
      }) {
        obj.set("media_type", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      size(obj, val, {
        field,
        schema
      }) {
        obj.set("size", bakedInputRuntime(schema, field.type, val));
      },
      storagePath(obj, val, {
        field,
        schema
      }) {
        obj.set("storage_path", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ArtifactPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      content(obj, val, {
        field,
        schema
      }) {
        obj.set("content", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      digest(obj, val, {
        field,
        schema
      }) {
        obj.set("digest", bakedInputRuntime(schema, field.type, val));
      },
      mediaType(obj, val, {
        field,
        schema
      }) {
        obj.set("media_type", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      size(obj, val, {
        field,
        schema
      }) {
        obj.set("size", bakedInputRuntime(schema, field.type, val));
      },
      storagePath(obj, val, {
        field,
        schema
      }) {
        obj.set("storage_path", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ArtifactToManyCargoMetadatumFilter: {
    plans: {
      every($where, value) {
        assertAllowed37(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed37(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed37(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  ArtifactToManyTagFilter: {
    plans: {
      every($where, value) {
        assertAllowed32(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed32(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed32(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  BooleanFilter: {
    plans: {
      distinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve53(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "distinctFrom"
          });
        $where.where(fragment);
      },
      equalTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve51(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "equalTo"
          });
        $where.where(fragment);
      },
      greaterThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve59(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThan"
          });
        $where.where(fragment);
      },
      greaterThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve60(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanOrEqualTo"
          });
        $where.where(fragment);
      },
      in($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec23 ? resolveInputCodec23(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve55(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "in"
          });
        $where.where(fragment);
      },
      isNull($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec21 ? resolveInputCodec21(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue14 ? resolveSqlValue14($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve50(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "isNull"
          });
        $where.where(fragment);
      },
      lessThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve57(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThan"
          });
        $where.where(fragment);
      },
      lessThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve58(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanOrEqualTo"
          });
        $where.where(fragment);
      },
      notDistinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve54(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notDistinctFrom"
          });
        $where.where(fragment);
      },
      notEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve52(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEqualTo"
          });
        $where.where(fragment);
      },
      notIn($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec23 ? resolveInputCodec23(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve56(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIn"
          });
        $where.where(fragment);
      }
    }
  },
  CargoMetadatumCondition: {
    plans: {
      artifactId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      name($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "name",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      vers($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "vers",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      }
    }
  },
  CargoMetadatumFilter: {
    plans: {
      and($where, value) {
        assertAllowed39(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      artifact($where, value) {
        assertAllowed38(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name
        });
        registryConfig.pgRelations.cargoMetadata.artifactByMyArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.cargoMetadata.artifactByMyArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      artifactId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec16;
        return condition;
      },
      name(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec17;
        return condition;
      },
      not($where, value) {
        assertAllowed39(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed39(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec15;
        return condition;
      },
      vers(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec18;
        return condition;
      }
    }
  },
  CargoMetadatumInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      cksum(obj, val, {
        field,
        schema
      }) {
        obj.set("cksum", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      deps(obj, val, {
        field,
        schema
      }) {
        obj.set("deps", bakedInputRuntime(schema, field.type, val));
      },
      features(obj, val, {
        field,
        schema
      }) {
        obj.set("features", bakedInputRuntime(schema, field.type, val));
      },
      links(obj, val, {
        field,
        schema
      }) {
        obj.set("links", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      rustVersion(obj, val, {
        field,
        schema
      }) {
        obj.set("rust_version", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      },
      v(obj, val, {
        field,
        schema
      }) {
        obj.set("v", bakedInputRuntime(schema, field.type, val));
      },
      vers(obj, val, {
        field,
        schema
      }) {
        obj.set("vers", bakedInputRuntime(schema, field.type, val));
      },
      yanked(obj, val, {
        field,
        schema
      }) {
        obj.set("yanked", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  CargoMetadatumPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      cksum(obj, val, {
        field,
        schema
      }) {
        obj.set("cksum", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      deps(obj, val, {
        field,
        schema
      }) {
        obj.set("deps", bakedInputRuntime(schema, field.type, val));
      },
      features(obj, val, {
        field,
        schema
      }) {
        obj.set("features", bakedInputRuntime(schema, field.type, val));
      },
      links(obj, val, {
        field,
        schema
      }) {
        obj.set("links", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      rustVersion(obj, val, {
        field,
        schema
      }) {
        obj.set("rust_version", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      },
      v(obj, val, {
        field,
        schema
      }) {
        obj.set("v", bakedInputRuntime(schema, field.type, val));
      },
      vers(obj, val, {
        field,
        schema
      }) {
        obj.set("vers", bakedInputRuntime(schema, field.type, val));
      },
      yanked(obj, val, {
        field,
        schema
      }) {
        obj.set("yanked", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ContainerMetadatumCondition: {
    plans: {
      artifactId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  ContainerMetadatumFilter: {
    plans: {
      and($where, value) {
        assertAllowed29(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      artifact($where, value) {
        assertAllowed28(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name
        });
        registryConfig.pgRelations.containerMetadata.artifactByMyArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.containerMetadata.artifactByMyArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      artifactId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec8;
        return condition;
      },
      not($where, value) {
        assertAllowed29(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed29(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      }
    }
  },
  ContainerMetadatumInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      architecture(obj, val, {
        field,
        schema
      }) {
        obj.set("architecture", bakedInputRuntime(schema, field.type, val));
      },
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      configDigest(obj, val, {
        field,
        schema
      }) {
        obj.set("config_digest", bakedInputRuntime(schema, field.type, val));
      },
      layerDigests(obj, val, {
        field,
        schema
      }) {
        obj.set("layer_digests", bakedInputRuntime(schema, field.type, val));
      },
      os(obj, val, {
        field,
        schema
      }) {
        obj.set("os", bakedInputRuntime(schema, field.type, val));
      },
      schemaVersion(obj, val, {
        field,
        schema
      }) {
        obj.set("schema_version", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  ContainerMetadatumPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      architecture(obj, val, {
        field,
        schema
      }) {
        obj.set("architecture", bakedInputRuntime(schema, field.type, val));
      },
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      configDigest(obj, val, {
        field,
        schema
      }) {
        obj.set("config_digest", bakedInputRuntime(schema, field.type, val));
      },
      layerDigests(obj, val, {
        field,
        schema
      }) {
        obj.set("layer_digests", bakedInputRuntime(schema, field.type, val));
      },
      os(obj, val, {
        field,
        schema
      }) {
        obj.set("os", bakedInputRuntime(schema, field.type, val));
      },
      schemaVersion(obj, val, {
        field,
        schema
      }) {
        obj.set("schema_version", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  CreateApiTokenInput: {
    plans: {
      apiToken(qb, arg) {
        if (arg != null) return qb.setBuilder();
      },
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  CreateArtifactInput: {
    plans: {
      artifact(qb, arg) {
        if (arg != null) return qb.setBuilder();
      },
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  CreateCargoMetadatumInput: {
    plans: {
      cargoMetadatum(qb, arg) {
        if (arg != null) return qb.setBuilder();
      },
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  CreateContainerMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      containerMetadatum(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateFederatedSkillCacheInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      federatedSkillCache(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateFederatedSourceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      federatedSource(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateNamespaceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      namespace(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateRepositoryInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      repository(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateSchemaMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      schemaMetadatum(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateTagInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      tag(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateUploadSessionInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      uploadSession(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  CreateWasmMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      wasmMetadatum(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  DatetimeFilter: {
    plans: {
      distinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve42(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "distinctFrom"
          });
        $where.where(fragment);
      },
      equalTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve40(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "equalTo"
          });
        $where.where(fragment);
      },
      greaterThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve48(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThan"
          });
        $where.where(fragment);
      },
      greaterThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve49(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanOrEqualTo"
          });
        $where.where(fragment);
      },
      in($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec20 ? resolveInputCodec20(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve44(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "in"
          });
        $where.where(fragment);
      },
      isNull($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec18 ? resolveInputCodec18(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue13 ? resolveSqlValue13($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve39(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "isNull"
          });
        $where.where(fragment);
      },
      lessThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve46(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThan"
          });
        $where.where(fragment);
      },
      lessThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve47(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanOrEqualTo"
          });
        $where.where(fragment);
      },
      notDistinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve43(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notDistinctFrom"
          });
        $where.where(fragment);
      },
      notEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve41(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEqualTo"
          });
        $where.where(fragment);
      },
      notIn($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec20 ? resolveInputCodec20(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve45(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIn"
          });
        $where.where(fragment);
      }
    }
  },
  DeleteApiTokenByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteApiTokenInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteArtifactByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteArtifactInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteCargoMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteCargoMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteContainerMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteContainerMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteFederatedSkillCacheByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteFederatedSkillCacheInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteFederatedSourceByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteFederatedSourceByNamespaceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteFederatedSourceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteNamespaceByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteNamespaceByNameInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteNamespaceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteRepositoryByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteRepositoryInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteSchemaMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteSchemaMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteTagByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteTagInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteUploadSessionByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteUploadSessionInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteWasmMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  DeleteWasmMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      }
    }
  },
  FederatedSkillCacheCondition: {
    plans: {
      expiresAt($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "expires_at",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      slug($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "slug",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      sourceId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "source_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      vetStatus($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "vet_status",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      }
    }
  },
  FederatedSkillCacheFilter: {
    plans: {
      and($where, value) {
        assertAllowed53(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      expiresAt(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec35;
        return condition;
      },
      not($where, value) {
        assertAllowed53(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed53(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec32;
        return condition;
      },
      slug(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec34;
        return condition;
      },
      source($where, value) {
        assertAllowed52(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: federatedSourceIdentifier,
          alias: resource_federated_sourcePgResource.name
        });
        registryConfig.pgRelations.federatedSkillCache.federatedSourceByMySourceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.federatedSkillCache.federatedSourceByMySourceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      sourceId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec33;
        return condition;
      },
      vetStatus(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec36;
        return condition;
      }
    }
  },
  FederatedSkillCacheInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      content(obj, val, {
        field,
        schema
      }) {
        obj.set("content", bakedInputRuntime(schema, field.type, val));
      },
      contentDigest(obj, val, {
        field,
        schema
      }) {
        obj.set("content_digest", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      fetchedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("fetched_at", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      slug(obj, val, {
        field,
        schema
      }) {
        obj.set("slug", bakedInputRuntime(schema, field.type, val));
      },
      sourceId(obj, val, {
        field,
        schema
      }) {
        obj.set("source_id", bakedInputRuntime(schema, field.type, val));
      },
      upstreamMeta(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_meta", bakedInputRuntime(schema, field.type, val));
      },
      vetReason(obj, val, {
        field,
        schema
      }) {
        obj.set("vet_reason", bakedInputRuntime(schema, field.type, val));
      },
      vetStatus(obj, val, {
        field,
        schema
      }) {
        obj.set("vet_status", bakedInputRuntime(schema, field.type, val));
      },
      vettedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("vetted_at", bakedInputRuntime(schema, field.type, val));
      },
      vettedBy(obj, val, {
        field,
        schema
      }) {
        obj.set("vetted_by", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  FederatedSkillCachePatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      content(obj, val, {
        field,
        schema
      }) {
        obj.set("content", bakedInputRuntime(schema, field.type, val));
      },
      contentDigest(obj, val, {
        field,
        schema
      }) {
        obj.set("content_digest", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      fetchedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("fetched_at", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      slug(obj, val, {
        field,
        schema
      }) {
        obj.set("slug", bakedInputRuntime(schema, field.type, val));
      },
      sourceId(obj, val, {
        field,
        schema
      }) {
        obj.set("source_id", bakedInputRuntime(schema, field.type, val));
      },
      upstreamMeta(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_meta", bakedInputRuntime(schema, field.type, val));
      },
      vetReason(obj, val, {
        field,
        schema
      }) {
        obj.set("vet_reason", bakedInputRuntime(schema, field.type, val));
      },
      vetStatus(obj, val, {
        field,
        schema
      }) {
        obj.set("vet_status", bakedInputRuntime(schema, field.type, val));
      },
      vettedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("vetted_at", bakedInputRuntime(schema, field.type, val));
      },
      vettedBy(obj, val, {
        field,
        schema
      }) {
        obj.set("vetted_by", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  FederatedSourceCondition: {
    plans: {
      namespace($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "namespace",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      upstreamType($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "upstream_type",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      }
    }
  },
  FederatedSourceFilter: {
    plans: {
      and($where, value) {
        assertAllowed55(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      federatedSkillCachesBySourceId($where, value) {
        assertAllowed54(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: federatedSkillCacheIdentifier,
          alias: resource_federated_skill_cachePgResource.name,
          localAttributes: registryConfig.pgRelations.federatedSource.federatedSkillCachesByTheirSourceId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.federatedSource.federatedSkillCachesByTheirSourceId.remoteAttributes
        };
        return $rel;
      },
      federatedSkillCachesBySourceIdExist($where, value) {
        assertAllowed54(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: federatedSkillCacheIdentifier,
          alias: resource_federated_skill_cachePgResource.name,
          equals: value
        });
        registryConfig.pgRelations.federatedSource.federatedSkillCachesByTheirSourceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.federatedSource.federatedSkillCachesByTheirSourceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      namespace(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec38;
        return condition;
      },
      not($where, value) {
        assertAllowed55(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed55(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec37;
        return condition;
      },
      upstreamType(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec39;
        return condition;
      }
    }
  },
  FederatedSourceInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      cacheTtlSeconds(obj, val, {
        field,
        schema
      }) {
        obj.set("cache_ttl_seconds", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      enabled(obj, val, {
        field,
        schema
      }) {
        obj.set("enabled", bakedInputRuntime(schema, field.type, val));
      },
      namespace(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace", bakedInputRuntime(schema, field.type, val));
      },
      rateLimitRpm(obj, val, {
        field,
        schema
      }) {
        obj.set("rate_limit_rpm", bakedInputRuntime(schema, field.type, val));
      },
      requireVetting(obj, val, {
        field,
        schema
      }) {
        obj.set("require_vetting", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      tagListCacheTtlSeconds(obj, val, {
        field,
        schema
      }) {
        obj.set("tag_list_cache_ttl_seconds", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      },
      upstreamBaseUrl(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_base_url", bakedInputRuntime(schema, field.type, val));
      },
      upstreamType(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_type", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  FederatedSourcePatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      cacheTtlSeconds(obj, val, {
        field,
        schema
      }) {
        obj.set("cache_ttl_seconds", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      enabled(obj, val, {
        field,
        schema
      }) {
        obj.set("enabled", bakedInputRuntime(schema, field.type, val));
      },
      namespace(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace", bakedInputRuntime(schema, field.type, val));
      },
      rateLimitRpm(obj, val, {
        field,
        schema
      }) {
        obj.set("rate_limit_rpm", bakedInputRuntime(schema, field.type, val));
      },
      requireVetting(obj, val, {
        field,
        schema
      }) {
        obj.set("require_vetting", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      tagListCacheTtlSeconds(obj, val, {
        field,
        schema
      }) {
        obj.set("tag_list_cache_ttl_seconds", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      },
      upstreamBaseUrl(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_base_url", bakedInputRuntime(schema, field.type, val));
      },
      upstreamType(obj, val, {
        field,
        schema
      }) {
        obj.set("upstream_type", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  FederatedSourceToManyFederatedSkillCacheFilter: {
    plans: {
      every($where, value) {
        assertAllowed56(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed56(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed56(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  NamespaceCondition: {
    plans: {
      name($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "name",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      organizationId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "organization_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  NamespaceFilter: {
    plans: {
      and($where, value) {
        assertAllowed48(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      apiTokens($where, value) {
        assertAllowed47(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: apiTokenIdentifier,
          alias: resource_api_tokenPgResource.name,
          localAttributes: registryConfig.pgRelations.namespace.apiTokensByTheirNamespaceId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.namespace.apiTokensByTheirNamespaceId.remoteAttributes
        };
        return $rel;
      },
      apiTokensExist($where, value) {
        assertAllowed47(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: apiTokenIdentifier,
          alias: resource_api_tokenPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.namespace.apiTokensByTheirNamespaceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.namespace.apiTokensByTheirNamespaceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      name(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec30;
        return condition;
      },
      not($where, value) {
        assertAllowed48(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed48(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      organizationId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec31;
        return condition;
      },
      repositories($where, value) {
        assertAllowed47(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name,
          localAttributes: registryConfig.pgRelations.namespace.repositoriesByTheirNamespaceId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.namespace.repositoriesByTheirNamespaceId.remoteAttributes
        };
        return $rel;
      },
      repositoriesExist($where, value) {
        assertAllowed47(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.namespace.repositoriesByTheirNamespaceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.namespace.repositoriesByTheirNamespaceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec29;
        return condition;
      }
    }
  },
  NamespaceInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      organizationId(obj, val, {
        field,
        schema
      }) {
        obj.set("organization_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  NamespacePatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      organizationId(obj, val, {
        field,
        schema
      }) {
        obj.set("organization_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  NamespaceToManyApiTokenFilter: {
    plans: {
      every($where, value) {
        assertAllowed50(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed50(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed50(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  NamespaceToManyRepositoryFilter: {
    plans: {
      every($where, value) {
        assertAllowed49(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed49(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed49(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  RepositoryCondition: {
    plans: {
      artifactType($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_type",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      name($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "name",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      namespaceId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "namespace_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  RepositoryFilter: {
    plans: {
      and($where, value) {
        assertAllowed23(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      apiTokens($where, value) {
        assertAllowed21(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: apiTokenIdentifier,
          alias: resource_api_tokenPgResource.name,
          localAttributes: registryConfig.pgRelations.repository.apiTokensByTheirRepositoryId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.repository.apiTokensByTheirRepositoryId.remoteAttributes
        };
        return $rel;
      },
      apiTokensExist($where, value) {
        assertAllowed21(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: apiTokenIdentifier,
          alias: resource_api_tokenPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.repository.apiTokensByTheirRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.repository.apiTokensByTheirRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      artifacts($where, value) {
        assertAllowed21(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name,
          localAttributes: registryConfig.pgRelations.repository.artifactsByTheirRepositoryId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.repository.artifactsByTheirRepositoryId.remoteAttributes
        };
        return $rel;
      },
      artifactsExist($where, value) {
        assertAllowed21(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.repository.artifactsByTheirRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.repository.artifactsByTheirRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      artifactType(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec4;
        return condition;
      },
      name(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec3;
        return condition;
      },
      namespace($where, value) {
        assertAllowed22(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: namespaceIdentifier,
          alias: resource_namespacePgResource.name
        });
        registryConfig.pgRelations.repository.namespaceByMyNamespaceId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.repository.namespaceByMyNamespaceId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      namespaceId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec2;
        return condition;
      },
      not($where, value) {
        assertAllowed23(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed23(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec;
        return condition;
      },
      tags($where, value) {
        assertAllowed21(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: tagIdentifier,
          alias: resource_tagPgResource.name,
          localAttributes: registryConfig.pgRelations.repository.tagsByTheirRepositoryId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.repository.tagsByTheirRepositoryId.remoteAttributes
        };
        return $rel;
      },
      tagsExist($where, value) {
        assertAllowed21(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: tagIdentifier,
          alias: resource_tagPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.repository.tagsByTheirRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.repository.tagsByTheirRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      },
      uploadSessions($where, value) {
        assertAllowed21(value, "object");
        const $rel = $where.andPlan();
        $rel.extensions.pgFilterRelation = {
          tableExpression: uploadSessionIdentifier,
          alias: resource_upload_sessionPgResource.name,
          localAttributes: registryConfig.pgRelations.repository.uploadSessionsByTheirRepositoryId.localAttributes,
          remoteAttributes: registryConfig.pgRelations.repository.uploadSessionsByTheirRepositoryId.remoteAttributes
        };
        return $rel;
      },
      uploadSessionsExist($where, value) {
        assertAllowed21(value, "scalar");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: uploadSessionIdentifier,
          alias: resource_upload_sessionPgResource.name,
          equals: value
        });
        registryConfig.pgRelations.repository.uploadSessionsByTheirRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.repository.uploadSessionsByTheirRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
      }
    }
  },
  RepositoryInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactType(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_type", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      isPublic(obj, val, {
        field,
        schema
      }) {
        obj.set("is_public", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      namespaceId(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  RepositoryPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactType(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_type", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      description(obj, val, {
        field,
        schema
      }) {
        obj.set("description", bakedInputRuntime(schema, field.type, val));
      },
      isPublic(obj, val, {
        field,
        schema
      }) {
        obj.set("is_public", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      namespaceId(obj, val, {
        field,
        schema
      }) {
        obj.set("namespace_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  RepositoryToManyApiTokenFilter: {
    plans: {
      every($where, value) {
        assertAllowed44(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed44(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed44(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  RepositoryToManyArtifactFilter: {
    plans: {
      every($where, value) {
        assertAllowed24(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed24(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed24(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  RepositoryToManyTagFilter: {
    plans: {
      every($where, value) {
        assertAllowed40(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed40(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed40(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  RepositoryToManyUploadSessionFilter: {
    plans: {
      every($where, value) {
        assertAllowed41(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery.notPlan().andPlan();
      },
      none($where, value) {
        assertAllowed41(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.notPlan().existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      some($where, value) {
        assertAllowed41(value, "object");
        if (value == null) return;
        if (!$where.extensions.pgFilterRelation) throw Error("Invalid use of filter, 'pgFilterRelation' expected");
        const {
            localAttributes,
            remoteAttributes,
            tableExpression,
            alias
          } = $where.extensions.pgFilterRelation,
          $subQuery = $where.existsPlan({
            tableExpression,
            alias
          });
        localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      }
    }
  },
  SchemaMetadatumCondition: {
    plans: {
      artifactId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  SchemaMetadatumFilter: {
    plans: {
      and($where, value) {
        assertAllowed31(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      artifact($where, value) {
        assertAllowed30(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name
        });
        registryConfig.pgRelations.schemaMetadata.artifactByMyArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.schemaMetadata.artifactByMyArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      artifactId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec9;
        return condition;
      },
      not($where, value) {
        assertAllowed31(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed31(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      }
    }
  },
  SchemaMetadatumInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      isValid(obj, val, {
        field,
        schema
      }) {
        obj.set("is_valid", bakedInputRuntime(schema, field.type, val));
      },
      title(obj, val, {
        field,
        schema
      }) {
        obj.set("title", bakedInputRuntime(schema, field.type, val));
      },
      validationErrors(obj, val, {
        field,
        schema
      }) {
        obj.set("validation_errors", bakedInputRuntime(schema, field.type, val));
      },
      version(obj, val, {
        field,
        schema
      }) {
        obj.set("version", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  SchemaMetadatumPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      isValid(obj, val, {
        field,
        schema
      }) {
        obj.set("is_valid", bakedInputRuntime(schema, field.type, val));
      },
      title(obj, val, {
        field,
        schema
      }) {
        obj.set("title", bakedInputRuntime(schema, field.type, val));
      },
      validationErrors(obj, val, {
        field,
        schema
      }) {
        obj.set("validation_errors", bakedInputRuntime(schema, field.type, val));
      },
      version(obj, val, {
        field,
        schema
      }) {
        obj.set("version", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  StringFilter: {
    plans: {
      distinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve15(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "distinctFrom"
          });
        $where.where(fragment);
      },
      distinctFromInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier6 ? resolveSqlIdentifier6(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec10 ? resolveInputCodec10(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue5 ? resolveSqlValue5($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve15(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "distinctFromInsensitive"
          });
        $where.where(fragment);
      },
      endsWith($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput9 ? resolveInput9(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve31(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "endsWith"
          });
        $where.where(fragment);
      },
      endsWithInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput11 ? resolveInput11(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve33(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "endsWithInsensitive"
          });
        $where.where(fragment);
      },
      equalTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve13(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "equalTo"
          });
        $where.where(fragment);
      },
      equalToInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier4 ? resolveSqlIdentifier4(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec8 ? resolveInputCodec8(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue3 ? resolveSqlValue3($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve13(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "equalToInsensitive"
          });
        $where.where(fragment);
      },
      greaterThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve21(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThan"
          });
        $where.where(fragment);
      },
      greaterThanInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier12 ? resolveSqlIdentifier12(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec16 ? resolveInputCodec16(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue11 ? resolveSqlValue11($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve21(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanInsensitive"
          });
        $where.where(fragment);
      },
      greaterThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve22(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanOrEqualTo"
          });
        $where.where(fragment);
      },
      greaterThanOrEqualToInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier13 ? resolveSqlIdentifier13(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec17 ? resolveInputCodec17(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue12 ? resolveSqlValue12($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve22(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanOrEqualToInsensitive"
          });
        $where.where(fragment);
      },
      in($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec6 ? resolveInputCodec6(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve17(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "in"
          });
        $where.where(fragment);
      },
      includes($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput ? resolveInput(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve23(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "includes"
          });
        $where.where(fragment);
      },
      includesInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput3 ? resolveInput3(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve25(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "includesInsensitive"
          });
        $where.where(fragment);
      },
      inInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier8 ? resolveSqlIdentifier8(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec12 ? resolveInputCodec12(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue7 ? resolveSqlValue7($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve17(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "inInsensitive"
          });
        $where.where(fragment);
      },
      isNull($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec4 ? resolveInputCodec4(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue2 ? resolveSqlValue2($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve12(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "isNull"
          });
        $where.where(fragment);
      },
      lessThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve19(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThan"
          });
        $where.where(fragment);
      },
      lessThanInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier10 ? resolveSqlIdentifier10(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec14 ? resolveInputCodec14(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue9 ? resolveSqlValue9($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve19(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanInsensitive"
          });
        $where.where(fragment);
      },
      lessThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve20(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanOrEqualTo"
          });
        $where.where(fragment);
      },
      lessThanOrEqualToInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier11 ? resolveSqlIdentifier11(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec15 ? resolveInputCodec15(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue10 ? resolveSqlValue10($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve20(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanOrEqualToInsensitive"
          });
        $where.where(fragment);
      },
      like($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve35(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "like"
          });
        $where.where(fragment);
      },
      likeInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve37(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "likeInsensitive"
          });
        $where.where(fragment);
      },
      notDistinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve16(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notDistinctFrom"
          });
        $where.where(fragment);
      },
      notDistinctFromInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier7 ? resolveSqlIdentifier7(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec11 ? resolveInputCodec11(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue6 ? resolveSqlValue6($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve16(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notDistinctFromInsensitive"
          });
        $where.where(fragment);
      },
      notEndsWith($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput10 ? resolveInput10(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve32(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEndsWith"
          });
        $where.where(fragment);
      },
      notEndsWithInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput12 ? resolveInput12(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve34(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEndsWithInsensitive"
          });
        $where.where(fragment);
      },
      notEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve14(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEqualTo"
          });
        $where.where(fragment);
      },
      notEqualToInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier5 ? resolveSqlIdentifier5(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec9 ? resolveInputCodec9(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue4 ? resolveSqlValue4($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve14(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEqualToInsensitive"
          });
        $where.where(fragment);
      },
      notIn($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec6 ? resolveInputCodec6(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve18(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIn"
          });
        $where.where(fragment);
      },
      notIncludes($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput2 ? resolveInput2(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve24(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIncludes"
          });
        $where.where(fragment);
      },
      notIncludesInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput4 ? resolveInput4(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve26(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIncludesInsensitive"
          });
        $where.where(fragment);
      },
      notInInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier9 ? resolveSqlIdentifier9(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec13 ? resolveInputCodec13(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue8 ? resolveSqlValue8($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve18(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notInInsensitive"
          });
        $where.where(fragment);
      },
      notLike($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve36(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notLike"
          });
        $where.where(fragment);
      },
      notLikeInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve38(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notLikeInsensitive"
          });
        $where.where(fragment);
      },
      notStartsWith($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput6 ? resolveInput6(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve28(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notStartsWith"
          });
        $where.where(fragment);
      },
      notStartsWithInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput8 ? resolveInput8(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve30(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notStartsWithInsensitive"
          });
        $where.where(fragment);
      },
      startsWith($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput5 ? resolveInput5(value) : value,
          inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve27(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "startsWith"
          });
        $where.where(fragment);
      },
      startsWithInsensitive($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = resolveInput7 ? resolveInput7(value) : value,
          inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve29(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "startsWithInsensitive"
          });
        $where.where(fragment);
      }
    }
  },
  TagCondition: {
    plans: {
      artifactId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      name($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "name",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
          }
        });
      },
      repositoryId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "repository_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  TagFilter: {
    plans: {
      and($where, value) {
        assertAllowed34(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      artifact($where, value) {
        assertAllowed33(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name
        });
        registryConfig.pgRelations.tag.artifactByMyArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.tag.artifactByMyArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      artifactId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec12;
        return condition;
      },
      name(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec13;
        return condition;
      },
      not($where, value) {
        assertAllowed34(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed34(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      repository($where, value) {
        assertAllowed33(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name
        });
        registryConfig.pgRelations.tag.repositoryByMyRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.tag.repositoryByMyRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      repositoryId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec11;
        return condition;
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec10;
        return condition;
      }
    }
  },
  TagInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  TagPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      name(obj, val, {
        field,
        schema
      }) {
        obj.set("name", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      },
      updatedAt(obj, val, {
        field,
        schema
      }) {
        obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  UpdateApiTokenByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateApiTokenInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateArtifactByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateArtifactInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateCargoMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateCargoMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateContainerMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateContainerMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateFederatedSkillCacheByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateFederatedSkillCacheInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateFederatedSourceByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateFederatedSourceByNamespaceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateFederatedSourceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateNamespaceByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateNamespaceByNameInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateNamespaceInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateRepositoryByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateRepositoryInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateSchemaMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateSchemaMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateTagByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateTagInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateUploadSessionByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateUploadSessionInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateWasmMetadatumByIdInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UpdateWasmMetadatumInput: {
    plans: {
      clientMutationId(qb, val) {
        qb.setMeta("clientMutationId", val);
      },
      patch(qb, arg) {
        if (arg != null) return qb.setBuilder();
      }
    }
  },
  UploadSessionCondition: {
    plans: {
      expiresAt($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "expires_at",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
          }
        });
      },
      repositoryId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "repository_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      },
      rowId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  UploadSessionFilter: {
    plans: {
      and($where, value) {
        assertAllowed43(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      expiresAt(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec21;
        return condition;
      },
      not($where, value) {
        assertAllowed43(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed43(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      },
      repository($where, value) {
        assertAllowed42(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: repositoryIdentifier,
          alias: resource_repositoryPgResource.name
        });
        registryConfig.pgRelations.uploadSession.repositoryByMyRepositoryId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.uploadSession.repositoryByMyRepositoryId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      repositoryId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec20;
        return condition;
      },
      rowId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec19;
        return condition;
      }
    }
  },
  UploadSessionInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      offset(obj, val, {
        field,
        schema
      }) {
        obj.set("offset", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  UploadSessionPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      createdAt(obj, val, {
        field,
        schema
      }) {
        obj.set("created_at", bakedInputRuntime(schema, field.type, val));
      },
      expiresAt(obj, val, {
        field,
        schema
      }) {
        obj.set("expires_at", bakedInputRuntime(schema, field.type, val));
      },
      offset(obj, val, {
        field,
        schema
      }) {
        obj.set("offset", bakedInputRuntime(schema, field.type, val));
      },
      repositoryId(obj, val, {
        field,
        schema
      }) {
        obj.set("repository_id", bakedInputRuntime(schema, field.type, val));
      },
      rowId(obj, val, {
        field,
        schema
      }) {
        obj.set("id", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  UUIDFilter: {
    plans: {
      distinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve4(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "distinctFrom"
          });
        $where.where(fragment);
      },
      equalTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve2(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "equalTo"
          });
        $where.where(fragment);
      },
      greaterThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve10(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThan"
          });
        $where.where(fragment);
      },
      greaterThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve11(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "greaterThanOrEqualTo"
          });
        $where.where(fragment);
      },
      in($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec3 ? resolveInputCodec3(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve6(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "in"
          });
        $where.where(fragment);
      },
      isNull($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec ? resolveInputCodec(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = resolveSqlValue ? resolveSqlValue($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "isNull"
          });
        $where.where(fragment);
      },
      lessThan($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve8(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThan"
          });
        $where.where(fragment);
      },
      lessThanOrEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve9(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "lessThanOrEqualTo"
          });
        $where.where(fragment);
      },
      notDistinctFrom($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve5(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notDistinctFrom"
          });
        $where.where(fragment);
      },
      notEqualTo($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve3(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notEqualTo"
          });
        $where.where(fragment);
      },
      notIn($where, value) {
        if (!$where.extensions?.pgFilterAttribute) throw Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
        if (value === void 0) return;
        const {
            fieldName: parentFieldName,
            attributeName,
            attribute,
            codec,
            expression
          } = $where.extensions.pgFilterAttribute,
          sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
          sourceCodec = codec ?? attribute.codec,
          [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
        if (false && value === null) return;
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const resolvedInput = value,
          inputCodec = resolveInputCodec3 ? resolveInputCodec3(codec ?? attribute.codec) : codec ?? attribute.codec,
          sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
          fragment = resolve7(sqlIdentifier, sqlValue, value, $where, {
            fieldName: parentFieldName ?? null,
            operatorName: "notIn"
          });
        $where.where(fragment);
      }
    }
  },
  WasmMetadatumCondition: {
    plans: {
      artifactId($condition, val) {
        $condition.where({
          type: "attribute",
          attribute: "artifact_id",
          callback(expression) {
            return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
          }
        });
      }
    }
  },
  WasmMetadatumFilter: {
    plans: {
      and($where, value) {
        assertAllowed36(value, "list");
        if (value == null) return;
        return $where.andPlan();
      },
      artifact($where, value) {
        assertAllowed35(value, "object");
        if (value == null) return;
        const $subQuery = $where.existsPlan({
          tableExpression: artifactIdentifier,
          alias: resource_artifactPgResource.name
        });
        registryConfig.pgRelations.wasmMetadata.artifactByMyArtifactId.localAttributes.forEach((localAttribute, i) => {
          const remoteAttribute = registryConfig.pgRelations.wasmMetadata.artifactByMyArtifactId.remoteAttributes[i];
          $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
        });
        return $subQuery;
      },
      artifactId(queryBuilder, value) {
        if (value === void 0) return;
        if (!false && isEmpty(value)) throw Object.assign(Error("Empty objects are forbidden in filter argument input."), {});
        if (!false && value === null) throw Object.assign(Error("Null literals are forbidden in filter argument input."), {});
        const condition = new PgCondition(queryBuilder);
        condition.extensions.pgFilterAttribute = colSpec14;
        return condition;
      },
      not($where, value) {
        assertAllowed36(value, "object");
        if (value == null) return;
        return $where.notPlan().andPlan();
      },
      or($where, value) {
        assertAllowed36(value, "list");
        if (value == null) return;
        const $or = $where.orPlan();
        return () => $or.andPlan();
      }
    }
  },
  WasmMetadatumInput: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      exports(obj, val, {
        field,
        schema
      }) {
        obj.set("exports", bakedInputRuntime(schema, field.type, val));
      },
      imports(obj, val, {
        field,
        schema
      }) {
        obj.set("imports", bakedInputRuntime(schema, field.type, val));
      },
      runtime(obj, val, {
        field,
        schema
      }) {
        obj.set("runtime", bakedInputRuntime(schema, field.type, val));
      }
    }
  },
  WasmMetadatumPatch: {
    baked: createObjectAndApplyChildren,
    plans: {
      artifactId(obj, val, {
        field,
        schema
      }) {
        obj.set("artifact_id", bakedInputRuntime(schema, field.type, val));
      },
      exports(obj, val, {
        field,
        schema
      }) {
        obj.set("exports", bakedInputRuntime(schema, field.type, val));
      },
      imports(obj, val, {
        field,
        schema
      }) {
        obj.set("imports", bakedInputRuntime(schema, field.type, val));
      },
      runtime(obj, val, {
        field,
        schema
      }) {
        obj.set("runtime", bakedInputRuntime(schema, field.type, val));
      }
    }
  }
};
export const scalars = {
  BigInt: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"BigInt" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  Cursor: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"Cursor" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  Datetime: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"Datetime" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  JSON: {
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return value;
    },
    parseLiteral: (() => {
      const parseLiteralToObject = (ast, variables) => {
        switch (ast.kind) {
          case Kind.STRING:
          case Kind.BOOLEAN:
            return ast.value;
          case Kind.INT:
          case Kind.FLOAT:
            return parseFloat(ast.value);
          case Kind.OBJECT:
            {
              const value = Object.create(null);
              ast.fields.forEach(field => {
                value[field.name.value] = parseLiteralToObject(field.value, variables);
              });
              return value;
            }
          case Kind.LIST:
            return ast.values.map(n => parseLiteralToObject(n, variables));
          case Kind.NULL:
            return null;
          case Kind.VARIABLE:
            {
              const name = ast.name.value;
              return variables ? variables[name] : void 0;
            }
          default:
            return;
        }
      };
      return parseLiteralToObject;
    })()
  },
  UUID: {
    serialize: UUIDSerialize,
    parseValue(value) {
      return coerce("" + value);
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"UUID" ?? "This scalar"} can only parse string values (kind = '${ast.kind}')`);
      return coerce(ast.value);
    }
  }
};
export const enums = {
  ApiTokenOrderBy: {
    values: {
      CREATED_BY_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "created_by",
          direction: "ASC"
        });
      },
      CREATED_BY_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "created_by",
          direction: "DESC"
        });
      },
      IS_ACTIVE_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "is_active",
          direction: "ASC"
        });
      },
      IS_ACTIVE_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "is_active",
          direction: "DESC"
        });
      },
      NAMESPACE_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace_id",
          direction: "ASC"
        });
      },
      NAMESPACE_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace_id",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        api_tokenUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        api_tokenUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      REPOSITORY_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "ASC"
        });
      },
      REPOSITORY_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "DESC"
        });
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      TOKEN_HASH_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "token_hash",
          direction: "ASC"
        });
      },
      TOKEN_HASH_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "token_hash",
          direction: "DESC"
        });
      },
      TOKEN_PREFIX_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "token_prefix",
          direction: "ASC"
        });
      },
      TOKEN_PREFIX_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "token_prefix",
          direction: "DESC"
        });
      }
    }
  },
  ArtifactOrderBy: {
    values: {
      DIGEST_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "digest",
          direction: "ASC"
        });
      },
      DIGEST_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "digest",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        artifactUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        artifactUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      REPOSITORY_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "ASC"
        });
      },
      REPOSITORY_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "DESC"
        });
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  CargoMetadatumOrderBy: {
    values: {
      ARTIFACT_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "ASC"
        });
      },
      ARTIFACT_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "DESC"
        });
      },
      NAME_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "ASC"
        });
      },
      NAME_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        cargo_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        cargo_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      VERS_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "vers",
          direction: "ASC"
        });
      },
      VERS_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "vers",
          direction: "DESC"
        });
      }
    }
  },
  ContainerMetadatumOrderBy: {
    values: {
      ARTIFACT_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ARTIFACT_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        container_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        container_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  FederatedSkillCacheOrderBy: {
    values: {
      EXPIRES_AT_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "expires_at",
          direction: "ASC"
        });
      },
      EXPIRES_AT_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "expires_at",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        federated_skill_cacheUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        federated_skill_cacheUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      SLUG_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "slug",
          direction: "ASC"
        });
      },
      SLUG_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "slug",
          direction: "DESC"
        });
      },
      SOURCE_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "source_id",
          direction: "ASC"
        });
      },
      SOURCE_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "source_id",
          direction: "DESC"
        });
      },
      VET_STATUS_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "vet_status",
          direction: "ASC"
        });
      },
      VET_STATUS_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "vet_status",
          direction: "DESC"
        });
      }
    }
  },
  FederatedSourceOrderBy: {
    values: {
      NAMESPACE_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      NAMESPACE_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        federated_sourceUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        federated_sourceUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      UPSTREAM_TYPE_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "upstream_type",
          direction: "ASC"
        });
      },
      UPSTREAM_TYPE_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "upstream_type",
          direction: "DESC"
        });
      }
    }
  },
  NamespaceOrderBy: {
    values: {
      NAME_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      NAME_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ORGANIZATION_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "organization_id",
          direction: "ASC"
        });
      },
      ORGANIZATION_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "organization_id",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        namespaceUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        namespaceUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  RepositoryOrderBy: {
    values: {
      ARTIFACT_TYPE_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_type",
          direction: "ASC"
        });
      },
      ARTIFACT_TYPE_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_type",
          direction: "DESC"
        });
      },
      NAME_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "ASC"
        });
      },
      NAME_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "DESC"
        });
      },
      NAMESPACE_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace_id",
          direction: "ASC"
        });
      },
      NAMESPACE_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "namespace_id",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        repositoryUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        repositoryUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  SchemaMetadatumOrderBy: {
    values: {
      ARTIFACT_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ARTIFACT_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        schema_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        schema_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  TagOrderBy: {
    values: {
      ARTIFACT_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "ASC"
        });
      },
      ARTIFACT_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "DESC"
        });
      },
      NAME_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "ASC"
        });
      },
      NAME_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "name",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        tagUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        tagUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      REPOSITORY_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "ASC"
        });
      },
      REPOSITORY_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "DESC"
        });
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  UploadSessionOrderBy: {
    values: {
      EXPIRES_AT_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "expires_at",
          direction: "ASC"
        });
      },
      EXPIRES_AT_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "expires_at",
          direction: "DESC"
        });
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        upload_sessionUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        upload_sessionUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      REPOSITORY_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "ASC"
        });
      },
      REPOSITORY_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "repository_id",
          direction: "DESC"
        });
      },
      ROW_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ROW_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  },
  WasmMetadatumOrderBy: {
    values: {
      ARTIFACT_ID_ASC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "ASC"
        });
        queryBuilder.setOrderIsUnique();
      },
      ARTIFACT_ID_DESC(queryBuilder) {
        queryBuilder.orderBy({
          attribute: "artifact_id",
          direction: "DESC"
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_ASC(queryBuilder) {
        wasm_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "ASC"
          });
        });
        queryBuilder.setOrderIsUnique();
      },
      PRIMARY_KEY_DESC(queryBuilder) {
        wasm_metadataUniques[0].attributes.forEach(attributeName => {
          queryBuilder.orderBy({
            attribute: attributeName,
            direction: "DESC"
          });
        });
        queryBuilder.setOrderIsUnique();
      }
    }
  }
};
export const schema = makeGrafastSchema({
  typeDefs: typeDefs,
  objects: objects,
  interfaces: interfaces,
  inputObjects: inputObjects,
  scalars: scalars,
  enums: enums
});