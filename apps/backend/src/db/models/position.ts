import { Games, Team, Users } from "../schema";
import { integer, pgTable, point, timestamp } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const Positions = pgTable("positions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	gameId: integer("game_id")
		.references(() => Games.id)
		.notNull(),
	userId: integer("user_id")
		.references(() => Users.id)
		.notNull(),
	team: Team("team").notNull(),
	position: point("position", { mode: "tuple" }).notNull(),
	timestamp: timestamp("timestamp", { mode: "date", precision: 0 }).notNull().defaultNow(),
});

export const PositionRelations = relations(Positions, ({ one }) => ({
	game: one(Games, {
		fields: [Positions.gameId],
		references: [Games.id],
	}),
	user: one(Users, {
		fields: [Positions.userId],
		references: [Users.id],
	}),
}));
