import z from "zod";
import { User } from "../models/user";
import { Cords, Game, GameTime } from "../models/game";

// Data that comes FROM the client TO the server
export type ClientToServerEvents = {
	// message: (data: any) => void;
	"general:positionUpdate": (data: { cords: Cords }) => void;
};

// Data that goes FROM the server TO the client
export type ServerToClientEvents = {
	// error: (data: { message: string }) => void;
	// message: (data: any) => void;
	"general:playerPositionUpdate": (data: { userId: User["id"]; cords: Cords; gameTime: GameTime }) => void;
};

// Inter-server events (if needed)
export interface InterServerEvents {}

// Socket data (data stored on the socket instance)
export interface SocketData {
	userId: User["id"];
	gameId: Game["id"];
}

export const SocketAuthToken = z
	.string()
	.transform((val) => {
		const parts = val.split(":");
		return parts;
	})
	.refine(
		(parts) => {
			return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
		},
		{
			message: "Invalid socket auth token format",
		},
	)
	.transform((parts) => [Number(parts[0]), parts[1]])
	.refine(
		([gameId]) => {
			return Number.isInteger(gameId) && (gameId as number) > 0;
		},
		{
			message: "Invalid socket auth token game ID",
		},
	)
	.transform(([gameId, jwt]) => {
		return { gameId, jwt } as { gameId: number; jwt: string };
	});

export type SocketAuthToken = z.infer<typeof SocketAuthToken>;
