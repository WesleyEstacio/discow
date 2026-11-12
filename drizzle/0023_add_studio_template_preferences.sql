CREATE TABLE "studio_template_preference" (
	"template_key" text PRIMARY KEY NOT NULL,
	"list_position" integer DEFAULT 0 NOT NULL,
	"tag" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
