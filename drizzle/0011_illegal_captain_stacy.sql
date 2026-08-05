CREATE TABLE "discover_pick" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spotify_id" text NOT NULL,
	"album_name" text NOT NULL,
	"artists" text[] NOT NULL,
	"image_url" text,
	"release_date" text,
	"spotify_url" text NOT NULL,
	"genre" text NOT NULL,
	"decade_start_year" integer NOT NULL,
	"artist" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discover_pick" ADD CONSTRAINT "discover_pick_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discover_pick_user_id_created_at_idx" ON "discover_pick" USING btree ("user_id","created_at");