DROP INDEX "games_start_at_ended_at_index";--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "ended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "game_sessions_game_id_index" ON "game_sessions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_sessions_started_at_index" ON "game_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "games_ended_index" ON "games" USING btree ("ended");--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "start_at";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "ended_at";