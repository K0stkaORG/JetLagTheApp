import { Coordinates, Dataset, User } from ".";

export type Game = {
	id: number;
	datasetId: Dataset["id"];
	hiders: User["id"][];
	hidersTeamLeader: User["id"];
	seekers: User["id"][];
	state: "planned" | "hiding_phase" | "main_phase" | "paused" | "finished";
	startsAt: Date;
	duration: number | null;
	hidingSpot: Coordinates | null;
};

export type GameEvent = {
	id: number;
	gameId: Game["id"];
	type: "hiding_phase_started" | "main_phase_started" | "game_paused" | "game_resumed" | "game_finished";
	timestamp: Date;
};

export type Team = "hiders" | "seekers";
