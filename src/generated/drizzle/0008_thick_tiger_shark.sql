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
ALTER TABLE "scan_result" ADD CONSTRAINT "scan_result_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scan_result_id_index" ON "scan_result" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_result_artifact_id_index" ON "scan_result" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "scan_result_status_index" ON "scan_result" USING btree ("status");