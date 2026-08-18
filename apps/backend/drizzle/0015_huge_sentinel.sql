CREATE TYPE "public"."dataset_state" AS ENUM('parsing', 'latest', 'outdated', 'errored');--> statement-breakpoint
ALTER TABLE "datasets" ADD COLUMN "state" "dataset_state";--> statement-breakpoint
UPDATE "datasets" SET "state" = CASE WHEN "latest" = true THEN 'latest'::"dataset_state" ELSE 'outdated'::"dataset_state" END;--> statement-breakpoint
ALTER TABLE "datasets" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "datasets" DROP COLUMN "latest";