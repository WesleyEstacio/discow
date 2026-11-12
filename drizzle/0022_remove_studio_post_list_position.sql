UPDATE "studio_post" SET "status" = 'draft' WHERE "status" = 'postponed';--> statement-breakpoint
DROP INDEX "studio_post_list_position_idx";--> statement-breakpoint
ALTER TABLE "studio_post" DROP COLUMN "list_position";