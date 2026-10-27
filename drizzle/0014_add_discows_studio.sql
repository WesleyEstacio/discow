CREATE TABLE "studio_album" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist_names" text[] NOT NULL,
	"release_year" integer,
	"cover_image_url" text,
	"cover_source" text,
	"dominant_color_hex" text,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"editorial_description" text DEFAULT '' NOT NULL,
	"editorial_notes" text DEFAULT '' NOT NULL,
	"spotify_url" text,
	"external_source" text NOT NULL,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_album_external_unique" UNIQUE("external_source","external_id")
);
--> statement-breakpoint
CREATE TABLE "studio_post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"template_key" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"language" text DEFAULT 'pt' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slides" jsonb NOT NULL,
	"album_ids" text[] DEFAULT '{}' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"scheduled_for" timestamp,
	"published_at" timestamp,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_post" ADD CONSTRAINT "studio_post_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_album_created_at_idx" ON "studio_album" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "studio_post_status_idx" ON "studio_post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "studio_post_scheduled_for_idx" ON "studio_post" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "studio_post_updated_at_idx" ON "studio_post" USING btree ("updated_at");