ALTER TABLE "datasets" RENAME COLUMN "data" TO "input";--> statement-breakpoint
DELETE FROM "datasets" WHERE true;
DELETE FROM "datasets_metadata" WHERE true;
ALTER TABLE "datasets" ADD COLUMN "parsed" jsonb NOT NULL;
