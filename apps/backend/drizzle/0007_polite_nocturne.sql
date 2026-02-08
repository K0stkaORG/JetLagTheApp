DELETE FROM "games";--> statement-breakpoint

CREATE TABLE "datasets_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "datasets_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(63) NOT NULL,
	"game_type" "game_types" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "datasets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"metadata_id" integer NOT NULL,
	"version" integer NOT NULL,
	"latest" boolean DEFAULT true NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "dataset_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_metadata_id_datasets_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."datasets_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "datasets_metadata_game_type_index" ON "datasets_metadata" USING btree ("game_type");--> statement-breakpoint
CREATE INDEX "datasets_metadata_id_index" ON "datasets" USING btree ("metadata_id");--> statement-breakpoint
CREATE INDEX "datasets_version_index" ON "datasets" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_metadata_version_index" ON "datasets" USING btree ("metadata_id","version");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;