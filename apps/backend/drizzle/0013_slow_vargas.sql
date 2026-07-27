DROP INDEX "game_states_game_id_index";--> statement-breakpoint
ALTER TABLE "game_states" ADD COLUMN "game_time" integer NOT NULL DEFAULT 0;
ALTER TABLE "game_states" ALTER COLUMN "game_time" DROP DEFAULT;
CREATE INDEX "game_states_game_time_index" ON "game_states" USING btree ("game_time");--> statement-breakpoint
CREATE INDEX "game_states_game_id_index" ON "game_states" USING btree ("game_id");
