import { Game, GameTypes, TimelinePhase } from "../models/game";

import { User } from "../models/user";
import z from "zod";

export const AdminLoginRequest = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});
export type AdminLoginRequest = z.infer<typeof AdminLoginRequest>;

export type AdminLoginResponse = {
	result: "success";
	token: string;
};

export type AdminGamesListResponse = {
	id: Game["id"];
	type: Game["type"];
	serverLoaded: boolean;
	timeline: {
		sync: Date;
		gameTime: number;
		phase: TimelinePhase;
	};
	players: {
		online: number;
		total: number;
	};
}[];

export const AdminRequestWithGameId = z.object({
	gameId: z.number().min(1, "Invalid game ID"),
});
export type AdminRequestWithGameId = z.infer<typeof AdminRequestWithGameId>;

export type AdminGameInfoResponse = Pick<
	AdminGamesListResponse[number],
	"id" | "type" | "serverLoaded" | "timeline"
> & {
	players: {
		userId: User["id"];
		nickname: User["nickname"];
		colors: User["colors"];
		isOnline: boolean;
	}[];
};

export const AdminAddPlayerRequest = z.object({
	gameId: z.number().min(1, "Invalid game ID"),
	userId: z.number().min(1, "Invalid user ID"),
});
export type AdminAddPlayerRequest = z.infer<typeof AdminAddPlayerRequest>;

export const AdminCreateGameRequest = z.object({
	type: z.enum(GameTypes),
	startAt: z.coerce
		.date()
		.transform((date) => new Date(date.setSeconds(0, 0)))
		.refine((date) => date > new Date(), "Start time must be in the future"),
});
export type AdminCreateGameRequest = z.infer<typeof AdminCreateGameRequest>;

export type AdminCreateGameResponse = {
	id: Game["id"];
};
