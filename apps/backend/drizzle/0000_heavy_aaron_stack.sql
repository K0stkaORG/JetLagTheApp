CREATE TYPE "public"."game_types" AS ENUM('hideAndSeek', 'roundabout');--> statement-breakpoint
CREATE TABLE "games" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "games_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "game_types" NOT NULL,
	"start_at" timestamp NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nickname" varchar(31) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"colors" jsonb NOT NULL,
	CONSTRAINT "users_nickname_unique" UNIQUE("nickname")
);
--> statement-breakpoint
CREATE INDEX "games_start_at_ended_at_index" ON "games" USING btree ("start_at","ended_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_nickname_index" ON "users" USING btree ("nickname");