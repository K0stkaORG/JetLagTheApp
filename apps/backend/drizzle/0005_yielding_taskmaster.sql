CREATE TABLE "player_positions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_positions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"game_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"coordinates" "point" NOT NULL,
	"game_time" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_positions" ADD CONSTRAINT "player_positions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_positions" ADD CONSTRAINT "player_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_positions_game_id_index" ON "player_positions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "player_positions_user_id_index" ON "player_positions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "player_positions_game_time_index" ON "player_positions" USING btree ("game_time");