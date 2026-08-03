import z from "zod";
import { DatasetInputFormat } from "./shared/dataset";

export const GameIdSchema = z.int().positive("Game ID must be a positive number");

export const GameTypes = ["hideAndSeek", "roundabout"] as const;
export const GameTypeSchema = z.enum(GameTypes);
export type GameType = (typeof GameTypes)[number];

export type Game = {
	id: number;
	type: GameType;
	ended: boolean;
	datasetId: Dataset["id"];
};

export type Dataset = {
	id: number;
	metadata: DatasetMetadata["id"];
	version: number;
	latest: boolean;
	data: DatasetInputFormat;
};

export type DatasetMetadata = {
	id: number;
	name: string;
	gameType: GameType;
};

export type GameTime = number;

export const TimelinePhases = ["not-started", "in-progress", "paused", "ended"] as const;
export const TimelinePhaseSchema = z.enum(TimelinePhases);
export type TimelinePhase = (typeof TimelinePhases)[number];

export type LobbyInfo = {
	id: Game["id"];
	datasetId: Dataset["id"];
	type: GameType;
	gameTime: GameTime;
	phase: TimelinePhase;
	players: {
		online: number;
		total: number;
	};
};
