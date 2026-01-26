export const GameTypes = ["hideAndSeek", "roundabout"] as const;
export type GameType = (typeof GameTypes)[number];

export type Game = {
	id: number;
	type: GameType;
	ended: boolean;
};

export type GameTime = number;

export type TimelinePhase = "not-started" | "in-progress" | "paused" | "ended";

export type JoinAdvertisement = {
	id: Game["id"];
	type: Game["type"];
	gameTime: number;
	phase: TimelinePhase;
};

type Latitude = number;
type Longitude = number;

export type Cords = [Latitude, Longitude];

export const NULL_CORDS: Cords = [0, 0] as const;

export const isValidCords = (cords: Cords): boolean => cords[0] !== 0 || cords[1] !== 0;
