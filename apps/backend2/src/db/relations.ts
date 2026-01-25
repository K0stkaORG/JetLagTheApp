import { GameAccess, GameSessions, Games, Users } from "./models";

import { relations } from "drizzle-orm";

export const UserRelations = relations(Users, ({ many }) => ({
	gameAccess: many(GameAccess),
}));

export const GameRelations = relations(Games, ({ many }) => ({
	gameAccess: many(GameAccess),
	gameSessions: many(GameSessions),
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

export const GameSessionRelations = relations(GameSessions, ({ one }) => ({
	game: one(Games, {
		fields: [GameSessions.gameId],
		references: [Games.id],
	}),
}));
