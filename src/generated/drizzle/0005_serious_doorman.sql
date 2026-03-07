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
ALTER TABLE "cargo_metadata" ADD CONSTRAINT "cargo_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cargo_metadata_artifact_id_index" ON "cargo_metadata" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cargo_metadata_name_vers_index" ON "cargo_metadata" USING btree ("name","vers");