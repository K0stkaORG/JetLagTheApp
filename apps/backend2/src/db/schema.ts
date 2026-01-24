import { GameTypes, User } from "@jetlag/shared-types";
import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

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
		startAt: timestamp("start_at", { mode: "date" }).notNull(),
		endedAt: timestamp("ended_at", { mode: "date" }),
	},
	(table) => [index("games_start_at_ended_at_index").on(table.startAt, table.endedAt)],
);
