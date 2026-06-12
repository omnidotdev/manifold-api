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
ALTER TABLE "npm_dist_tag" ADD CONSTRAINT "npm_dist_tag_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npm_metadata" ADD CONSTRAINT "npm_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "npm_dist_tag_repository_id_tag_index" ON "npm_dist_tag" USING btree ("repository_id","tag");--> statement-breakpoint
CREATE INDEX "npm_dist_tag_repository_id_index" ON "npm_dist_tag" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "npm_metadata_artifact_id_index" ON "npm_metadata" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "npm_metadata_name_version_index" ON "npm_metadata" USING btree ("name","version");