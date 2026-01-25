import { GameTypes, User } from "@jetlag/shared-types";
import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

import { boolean } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { uniqueIndex } from "drizzle-orm/pg-core";

export const Users = pgTable(
	"users",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		nickname: varchar("nickname", {
			length: 31,
		})
			.notNull()
			.unique(),
		passwordHash: varchar("password_hash", {
			length: 255,
		}).notNull(),
		colors: jsonb("colors").notNull().$type<User["colors"]>(),
	},
	(table) => [uniqueIndex("users_nickname_index").on(table.nickname)],
);

export const GameTypesEnum = pgEnum("game_types", GameTypes);

export const Games = pgTable(
	"games",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		type: GameTypesEnum("type").notNull(),
		ended: boolean("ended").notNull().default(false),
	},
	(table) => [index("games_ended_index").on(table.ended)],
);

export const GameAccess = pgTable(
	"game_access",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		gameId: integer("game_id")
			.notNull()
			.references(() => Games.id, { onDelete: "cascade" }),
		userId: integer("user_id")
			.notNull()
			.references(() => Users.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("game_access_user_id_index").on(table.userId),
		index("game_access_game_id_index").on(table.gameId),
		uniqueIndex("game_access_game_id_user_id_index").on(table.gameId, table.userId),
	],
);

export const GameSessions = pgTable(
	"game_sessions",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		gameId: integer("game_id")
			.notNull()
			.references(() => Games.id, { onDelete: "cascade" }),
		startedAt: timestamp("started_at", { mode: "date" }).notNull(),
		gameTimeDuration: integer("game_time_duration"),
	},
	(table) => [
		index("game_sessions_game_id_index").on(table.gameId),
		index("game_sessions_started_at_index").on(table.startedAt),
	],
);
