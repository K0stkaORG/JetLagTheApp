DROP INDEX "game_states_game_id_index";--> statement-breakpoint
CREATE UNIQUE INDEX "game_settings_game_id_index" ON "game_settings" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_states_game_id_index" ON "game_states" USING btree ("game_id");