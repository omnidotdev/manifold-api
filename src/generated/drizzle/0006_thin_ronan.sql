CREATE TABLE "plugin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"bin" text,
	"endpoint" text,
	"commands" jsonb DEFAULT '{}'::jsonb,
	"packages" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "plugin_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_id_index" ON "plugin" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_name_index" ON "plugin" USING btree ("name");