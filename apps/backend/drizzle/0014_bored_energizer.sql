ALTER TABLE "datasets" RENAME COLUMN "data" TO "input";--> statement-breakpoint
DELETE FROM "datasets" WHERE 1;
DELETE FROM "datasets_metadata" WHERE 1;
ALTER TABLE "datasets" ADD COLUMN "parsed" jsonb NOT NULL;
