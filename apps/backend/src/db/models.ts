import { Cords, DatasetSaveFormat, GameTypes, User } from "@jetlag/shared-types";
import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

import { boolean } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { point } from "drizzle-orm/pg-core";
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

export const Datasets = pgTable(
	"datasets",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		metadataId: integer("metadata_id")
			.notNull()
			.references(() => DatasetMetadata.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		latest: boolean("latest").notNull().default(true),
		data: jsonb("data").notNull().$type<DatasetSaveFormat>(),
	},
	(table) => [
		index("datasets_metadata_id_index").on(table.metadataId),
		index("datasets_version_index").on(table.version),
		uniqueIndex("datasets_metadata_version_index").on(table.metadataId, table.version),
	],
);

export const DatasetMetadata = pgTable(
	"datasets_metadata",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		name: varchar("name", {
			length: 63,
		}).notNull(),
		gameType: GameTypesEnum("game_type").notNull(),
	},
	(table) => [index("datasets_metadata_game_type_index").on(table.gameType)],
);

export const Games = pgTable(
	"games",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		type: GameTypesEnum("type").notNull(),
		ended: boolean("ended").notNull().default(false),
		datasetId: integer("dataset_id")
			.notNull()
			.references(() => Datasets.id, { onDelete: "cascade" }),
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

export const PlayerPositions = pgTable(
	"player_positions",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		gameId: integer("game_id")
			.notNull()
			.references(() => Games.id, { onDelete: "cascade" }),
		userId: integer("user_id")
			.notNull()
			.references(() => Users.id, { onDelete: "cascade" }),
		cords: point("cords", {
			mode: "tuple",
		})
			.$type<Cords>()
			.notNull(),
		gameTime: integer("game_time").notNull(),
	},
	(table) => [
		index("player_positions_game_id_index").on(table.gameId),
		index("player_positions_user_id_index").on(table.userId),
		index("player_positions_game_time_index").on(table.gameTime),
	],
);
