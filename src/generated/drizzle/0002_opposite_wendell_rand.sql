ALTER TABLE "namespace" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
CREATE INDEX "namespace_organization_id_index" ON "namespace" USING btree ("organization_id");