CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spotify_id" text NOT NULL,
	"album_name" text NOT NULL,
	"artists" text[] NOT NULL,
	"image_url" text,
	"release_date" text,
	"rating" real NOT NULL,
	"review_text" text DEFAULT '' NOT NULL,
	"listened_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_user_album_unique" UNIQUE("user_id","spotify_id")
);
--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;