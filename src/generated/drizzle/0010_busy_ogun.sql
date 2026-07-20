ALTER TABLE "artifact" ADD COLUMN "subject" text;--> statement-breakpoint
CREATE INDEX "artifact_repository_id_subject_index" ON "artifact" USING btree ("repository_id","subject");