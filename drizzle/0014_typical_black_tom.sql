CREATE TABLE "favorite_artist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spotify_id" text NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"genres" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_artist_user_artist_unique" UNIQUE("user_id","spotify_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_artist" ADD CONSTRAINT "favorite_artist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorite_artist_user_id_created_at_idx" ON "favorite_artist" USING btree ("user_id","created_at");