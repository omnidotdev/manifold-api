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
ALTER TABLE "federated_skill_cache" ADD CONSTRAINT "federated_skill_cache_source_id_federated_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."federated_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "federated_skill_cache_id_index" ON "federated_skill_cache" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_skill_cache_source_id_slug_index" ON "federated_skill_cache" USING btree ("source_id","slug");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_source_id_index" ON "federated_skill_cache" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_slug_index" ON "federated_skill_cache" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_vet_status_index" ON "federated_skill_cache" USING btree ("vet_status");--> statement-breakpoint
CREATE INDEX "federated_skill_cache_expires_at_index" ON "federated_skill_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_source_id_index" ON "federated_source" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "federated_source_namespace_index" ON "federated_source" USING btree ("namespace");--> statement-breakpoint
CREATE INDEX "federated_source_upstream_type_index" ON "federated_source" USING btree ("upstream_type");