CREATE TABLE "oidc_issuer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issuer" text NOT NULL,
	"jwks_uri" text,
	"audience" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "oidc_issuer_issuer_unique" UNIQUE("issuer")
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
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_namespace_id_namespace_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_publisher" ADD CONSTRAINT "trusted_publisher_issuer_id_oidc_issuer_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."oidc_issuer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trusted_publisher_namespace_id_index" ON "trusted_publisher" USING btree ("namespace_id");--> statement-breakpoint
CREATE INDEX "trusted_publisher_issuer_id_index" ON "trusted_publisher" USING btree ("issuer_id");--> statement-breakpoint
CREATE INDEX "trusted_publisher_subject_index" ON "trusted_publisher" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "trusted_publisher_is_active_index" ON "trusted_publisher" USING btree ("is_active");