CREATE TABLE "api_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"namespace_id" uuid NOT NULL,
	"repository_id" uuid,
	"scope" text DEFAULT 'read' NOT NULL,
	"created_by" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp(6) with time zone,
	"last_used_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artifact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"digest" text NOT NULL,
	"size" bigint NOT NULL,
	"media_type" text NOT NULL,
	"content" text,
	"storage_path" text,
	"subject" text,
	"created_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cargo_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"name" text NOT NULL,
	"vers" text NOT NULL,
	"deps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cksum" text NOT NULL,
	"yanked" boolean DEFAULT false NOT NULL,
	"links" text,
	"rust_version" text,
	"v" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "container_metadata" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"schema_version" integer NOT NULL,
	"architecture" text,
	"os" text,
	"config_digest" text,
	"layer_digests" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federated_skill_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"content_digest" text,
	"fetched_at" timestamp(6) with time zone,
	"expires_at" timestamp(6) with time zone,
	"vet_status" text DEFAULT 'pending' NOT NULL,
	"vet_reason" text,
	"vetted_by" text,
	"vetted_at" timestamp(6) with time zone,
	"upstream_meta" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "federated_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" text NOT NULL,
	"upstream_base_url" text NOT NULL,
	"upstream_type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_rpm" integer DEFAULT 100 NOT NULL,
	"cache_ttl_seconds" integer DEFAULT 3600 NOT NULL,
	"tag_list_cache_ttl_seconds" integer DEFAULT 600 NOT NULL,
	"require_vetting" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "federated_source_namespace_unique" UNIQUE("namespace")
);
--> statement-breakpoint
CREATE TABLE "namespace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "namespace_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "npm_dist_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"version" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "npm_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"shasum" text NOT NULL,
	"integrity" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oidc_issuer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issuer" text NOT NULL,
	"jwks_uri" text,
	"jwks_auth_token_path" text,
	"audience" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "oidc_issuer_issuer_unique" UNIQUE("issuer")
);
--> statement-breakpoint
CREATE TABLE "plugin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"bin" text,
	"endpoint" text,
	"commands" jsonb DEFAULT '{}'::jsonb,
	"packages" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "plugin_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"artifact_type" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"download_count" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scan_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scanner" text,
	"critical" integer DEFAULT 0 NOT NULL,
	"high" integer DEFAULT 0 NOT NULL,
	"medium" integer DEFAULT 0 NOT NULL,
	"low" integer DEFAULT 0 NOT NULL,
	"unknown" integer DEFAULT 0 NOT NULL,
	"findings" jsonb,
	"error" text,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"scanned_at" timestamp(6) with time zone
);
--> statement-breakpoint
CREATE TABLE "schema_metadata" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"version" text,
	"title" text,
	"is_valid" boolean DEFAULT true NOT NULL,
	"validation_errors" jsonb
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trusted_publisher" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace_id" uuid NOT NULL,
	"repository_id" uuid,
	"issuer_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"claim_constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scope" text DEFAULT 'write' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"last_used_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "upload_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"offset" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"expires_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wasm_metadata" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"runtime" text,
	"exports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"imports" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_metadata" ADD CONSTRAINT "cargo_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_metadata" ADD CONSTRAINT "container_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federated_skill_cache" ADD CONSTRAINT "federated_skill_cache_source_id_federated_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."federated_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npm_dist_tag" ADD CONSTRAINT "npm_dist_tag_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npm_metadata" ADD CONSTRAINT "npm_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_result" ADD CONSTRAINT "scan_result_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schema_metadata" ADD CONSTRAINT "schema_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_issuer_id_oidc_issuer_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."oidc_issuer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wasm_metadata" ADD CONSTRAINT "wasm_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_token_id_index" ON "api_token" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_token_token_hash_index" ON "api_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "api_token_token_prefix_index" ON "api_token" USING btree ("token_prefix");--> statement-breakpoint
CREATE INDEX "api_token_namespace_id_index" ON "api_token" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "api_token_repository_id_index" ON "api_token" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "api_token_created_by_index" ON "api_token" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "api_token_is_active_index" ON "api_token" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_id_index" ON "artifact" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_repository_id_digest_index" ON "artifact" USING btree ("repository_id","digest");--> statement-breakpoint
CREATE INDEX "artifact_repository_id_index" ON "artifact" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "artifact_digest_index" ON "artifact" USING btree ("digest");--> statement-breakpoint
CREATE INDEX "artifact_repository_id_subject_index" ON "artifact" USING btree ("repository_id","subject");--> statement-breakpoint
CREATE UNIQUE INDEX "cargo_metadata_artifact_id_index" ON "cargo_metadata" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cargo_metadata_name_vers_index" ON "cargo_metadata" USING btree ("name","vers");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_skill_cache_id_index" ON "federated_skill_cache" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_skill_cache_source_id_slug_index" ON "federated_skill_cache" USING btree ("source_id","slug");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_source_id_index" ON "federated_skill_cache" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_slug_index" ON "federated_skill_cache" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_vet_status_index" ON "federated_skill_cache" USING btree ("vet_status");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_expires_at_index" ON "federated_skill_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_source_id_index" ON "federated_source" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_source_namespace_index" ON "federated_source" USING btree ("namespace");--> statement-breakpoint
CREATE INDEX "federated_source_upstream_type_index" ON "federated_source" USING btree ("upstream_type");--> statement-breakpoint
CREATE UNIQUE INDEX "namespace_id_index" ON "namespace" USING btree ("id");--> statement-breakpoint
CREATE INDEX "namespace_name_index" ON "namespace" USING btree ("name");--> statement-breakpoint
CREATE INDEX "namespace_organization_id_index" ON "namespace" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "npm_dist_tag_repository_id_tag_index" ON "npm_dist_tag" USING btree ("repository_id","tag");--> statement-breakpoint
CREATE INDEX "npm_dist_tag_repository_id_index" ON "npm_dist_tag" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "npm_metadata_artifact_id_index" ON "npm_metadata" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "npm_metadata_name_version_index" ON "npm_metadata" USING btree ("name","version");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_id_index" ON "plugin" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_name_index" ON "plugin" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_id_index" ON "repository" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_namespace_id_name_index" ON "repository" USING btree ("namespace_id","name");--> statement-breakpoint
CREATE INDEX "repository_namespace_id_index" ON "repository" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "repository_artifact_type_index" ON "repository" USING btree ("artifact_type");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_result_id_index" ON "scan_result" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_result_artifact_id_index" ON "scan_result" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "scan_result_status_index" ON "scan_result" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_id_index" ON "tag" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_repository_id_name_index" ON "tag" USING btree ("repository_id","name");--> statement-breakpoint
CREATE INDEX "tag_repository_id_index" ON "tag" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "tag_artifact_id_index" ON "tag" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "trusted_publisher_namespace_id_index" ON "trusted_publisher" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "trusted_publisher_issuer_id_index" ON "trusted_publisher" USING btree ("issuer_id");--> statement-breakpoint
CREATE INDEX "trusted_publisher_subject_index" ON "trusted_publisher" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "trusted_publisher_is_active_index" ON "trusted_publisher" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "upload_session_id_index" ON "upload_session" USING btree ("id");--> statement-breakpoint
CREATE INDEX "upload_session_repository_id_index" ON "upload_session" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "upload_session_expires_at_index" ON "upload_session" USING btree ("expires_at");