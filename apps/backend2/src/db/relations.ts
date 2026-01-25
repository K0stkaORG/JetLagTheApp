import { GameAccess, Games, Users } from "./schema";

import { relations } from "drizzle-orm";

export const UserRelations = relations(Users, ({ many }) => ({
	gameAccess: many(GameAccess),
}));

export const GameRelations = relations(Games, ({ many }) => ({
	gameAccess: many(GameAccess),
}));

export const GameAccessRelations = relations(GameAccess, ({ one }) => ({
	user: one(Users, {
		fields: [GameAccess.userId],
		references: [Users.id],
	}),
	game: one(Games, {
		fields: [GameAccess.gameId],
		references: [Games.id],
	}),
}));
