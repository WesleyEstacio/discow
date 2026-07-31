CREATE TABLE "discowver_pick" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spotify_id" text NOT NULL,
	"album_name" text NOT NULL,
	"artists" text[] NOT NULL,
	"image_url" text,
	"release_date" text,
	"mode" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discowver_pick" ADD CONSTRAINT "discowver_pick_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
