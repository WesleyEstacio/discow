CREATE TABLE "studio_post_preset" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"template_key" text NOT NULL,
	"slide_styles" jsonb NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_post_preset_template_name_unique" UNIQUE("template_key","name")
);
--> statement-breakpoint
ALTER TABLE "studio_post_preset" ADD CONSTRAINT "studio_post_preset_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;