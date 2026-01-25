CREATE TABLE "game_access" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_access_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"game_id" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_access" ADD CONSTRAINT "game_access_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_access" ADD CONSTRAINT "game_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_access_user_id_index" ON "game_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_access_game_id_index" ON "game_access" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_access_game_id_user_id_index" ON "game_access" USING btree ("game_id","user_id");