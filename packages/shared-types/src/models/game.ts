export const GameTypes = ["hideAndSeek", "roundabout"] as const;
export type GameType = (typeof GameTypes)[number];

export type Game = {
	id: number;
	type: GameType;
	startAt: Date;
	endedAt: Date | null;
};

export type JoinAdvertisement = {
	id: Game["id"];
	type: Game["type"];
};
