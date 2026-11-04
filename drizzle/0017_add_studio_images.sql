CREATE TABLE "studio_image" (
	"id" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"byte_size" integer NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_image" ADD CONSTRAINT "studio_image_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_image_created_at_idx" ON "studio_image" USING btree ("created_at");