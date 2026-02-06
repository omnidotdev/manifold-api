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
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_token_id_index" ON "api_token" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_token_token_hash_index" ON "api_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "api_token_token_prefix_index" ON "api_token" USING btree ("token_prefix");--> statement-breakpoint
CREATE INDEX "api_token_namespace_id_index" ON "api_token" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "api_token_repository_id_index" ON "api_token" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "api_token_created_by_index" ON "api_token" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "api_token_is_active_index" ON "api_token" USING btree ("is_active");