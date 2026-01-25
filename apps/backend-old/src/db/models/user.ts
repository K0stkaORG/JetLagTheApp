import { Games, Positions } from "../schema";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const Users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	nickname: varchar("nickname", { length: 31 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	avatarUrl: varchar("avatar_url", { length: 255 }),
});

export const UserRelations = relations(Users, ({ many }) => ({
	hiderTeamLeaderInGames: many(Games),
	positions: many(Positions),
}));
