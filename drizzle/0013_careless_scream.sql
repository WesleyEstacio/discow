CREATE TABLE "favorite_album" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spotify_id" text NOT NULL,
	"album_name" text NOT NULL,
	"artists" text[] NOT NULL,
	"image_url" text,
	"release_date" text,
	"total_tracks" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_album_user_album_unique" UNIQUE("user_id","spotify_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_album" ADD CONSTRAINT "favorite_album_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorite_album_user_id_created_at_idx" ON "favorite_album" USING btree ("user_id","created_at");