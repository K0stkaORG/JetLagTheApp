import { Game, GameTime } from "../models/game";
import { HideAndSeekClientToServerEvents, HideAndSeekServerToClientEvents } from "./gameModes/hideAndSeek";
import { RoundaboutClientToServerEvents, RoundaboutServerToClientEvents } from "./gameModes/roundabout";

import z from "zod";
import { Cords } from "../models/geometry";
import { User } from "../models/user";
import { JoinGameDataPacket } from "../restAPI/game";

// Data that comes FROM the client TO the server
export type ClientToServerEvents = {
	"general.player.positionUpdate": (data: { cords: Cords }) => void;
} & HideAndSeekClientToServerEvents &
	RoundaboutClientToServerEvents;

// Data that goes FROM the server TO the client
export type ServerToClientEvents = {
	"general.notification": (data: { message: string }) => void;
	"general.error": (data: { message: string }) => void;

	"general.game.joinDataPacket": (data: JoinGameDataPacket) => void;

	"general.timeline.start": (data: { sync: Date }) => void;
	"general.timeline.pause": (data: { gameTime: GameTime; sync: Date }) => void;
	"general.timeline.resume": (data: { gameTime: GameTime; sync: Date }) => void;

	"general.shutdown": () => void;

	"general.player.isOnlineUpdate": (data: { userId: User["id"]; isOnline: boolean }) => void;
	"general.player.positionUpdate": (data: { userId: User["id"]; cords: Cords; gameTime: GameTime }) => void;
} & HideAndSeekServerToClientEvents &
	RoundaboutServerToClientEvents;

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
