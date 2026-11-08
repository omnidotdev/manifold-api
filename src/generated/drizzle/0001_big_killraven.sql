CREATE TABLE "pypi_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"filename" text NOT NULL,
	"filetype" text NOT NULL,
	"python_version" text,
	"requires_python" text,
	"requires_dist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata_version" text,
	"summary" text,
	"sha256" text NOT NULL,
	"blake2_256" text,
	"yanked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pypi_metadata" ADD CONSTRAINT "pypi_metadata_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pypi_metadata_artifact_id_index" ON "pypi_metadata" USING btree ("artifact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pypi_metadata_name_filename_index" ON "pypi_metadata" USING btree ("name","filename");--> statement-breakpoint
CREATE INDEX "pypi_metadata_name_index" ON "pypi_metadata" USING btree ("name");