import {
	DatasetMetadata,
	Datasets,
	GameAccess,
	GameSessions,
	GameSettings,
	Games,
	PlayerPositions,
	Users,
} from "./models";

import { relations } from "drizzle-orm";

export const UserRelations = relations(Users, ({ many }) => ({
	gameAccess: many(GameAccess),
	playerPositions: many(PlayerPositions),
}));

export const DatasetMetadataRelations = relations(DatasetMetadata, ({ many }) => ({
	datasets: many(Datasets),
}));

export const DatasetRelations = relations(Datasets, ({ one, many }) => ({
	metadata: one(DatasetMetadata, {
		fields: [Datasets.metadataId],
		references: [DatasetMetadata.id],
	}),
	games: many(Games),
}));

export const GameSettingsRelations = relations(GameSettings, ({ one }) => ({
	game: one(Games, {
		fields: [GameSettings.gameId],
		references: [Games.id],
	}),
}));

export const GameRelations = relations(Games, ({ one, many }) => ({
	dataset: one(Datasets, {
		fields: [Games.datasetId],
		references: [Datasets.id],
	}),
	gameSettings: one(GameSettings, {
		fields: [Games.id],
		references: [GameSettings.gameId],
	}),
	gameAccess: many(GameAccess),
	gameSessions: many(GameSessions),
	playerPositions: many(PlayerPositions),
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

export const PlayerPositionRelations = relations(PlayerPositions, ({ one }) => ({
	user: one(Users, {
		fields: [PlayerPositions.userId],
		references: [Users.id],
	}),
	game: one(Games, {
		fields: [PlayerPositions.gameId],
		references: [Games.id],
	}),
}));
