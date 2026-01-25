export const GameTypes = ["hideAndSeek", "roundabout"] as const;
export type GameType = (typeof GameTypes)[number];

export type Game = {
	id: number;
	type: GameType;
	ended: boolean;
};

export type TimelinePhase = "not-started" | "in-progress" | "paused" | "ended";

export type JoinAdvertisement = {
	id: Game["id"];
	type: Game["type"];
	gameTime: number;
	phase: TimelinePhase;
};
