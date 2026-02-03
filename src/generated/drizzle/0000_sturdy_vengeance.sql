CREATE TABLE "artifact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"digest" text NOT NULL,
	"size" bigint NOT NULL,
	"media_type" text NOT NULL,
	"content" text,
	"created_at" timestamp(6) with time zone DEFAULT now()
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
CREATE TABLE "namespace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "namespace_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"artifact_type" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
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
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_metadata" ADD CONSTRAINT "container_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schema_metadata" ADD CONSTRAINT "schema_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wasm_metadata" ADD CONSTRAINT "wasm_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_id_index" ON "artifact" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_repository_id_digest_index" ON "artifact" USING btree ("repository_id","digest");--> statement-breakpoint
CREATE INDEX "artifact_repository_id_index" ON "artifact" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "artifact_digest_index" ON "artifact" USING btree ("digest");--> statement-breakpoint
CREATE UNIQUE INDEX "namespace_id_index" ON "namespace" USING btree ("id");--> statement-breakpoint
CREATE INDEX "namespace_name_index" ON "namespace" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_id_index" ON "repository" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "repository_namespace_id_name_index" ON "repository" USING btree ("namespace_id","name");--> statement-breakpoint
CREATE INDEX "repository_namespace_id_index" ON "repository" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "repository_artifact_type_index" ON "repository" USING btree ("artifact_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_id_index" ON "tag" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_repository_id_name_index" ON "tag" USING btree ("repository_id","name");--> statement-breakpoint
CREATE INDEX "tag_repository_id_index" ON "tag" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "tag_artifact_id_index" ON "tag" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "upload_session_id_index" ON "upload_session" USING btree ("id");--> statement-breakpoint
CREATE INDEX "upload_session_repository_id_index" ON "upload_session" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "upload_session_expires_at_index" ON "upload_session" USING btree ("expires_at");