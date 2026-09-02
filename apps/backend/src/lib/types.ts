import {
	BaseClientToServerEvents,
	BaseServerToClientEvents,
	Gamemode,
	GameType,
	SocketData,
} from "@jetlag/shared-types";
import { Server, Socket } from "socket.io";

export type BaseGameServerIO = Server<BaseClientToServerEvents, BaseServerToClientEvents, never, SocketData>;
export type BaseGameServerSocket = Socket<BaseClientToServerEvents, BaseServerToClientEvents, never, SocketData>;

export type GameServerIO<T extends GameType = GameType> = Server<
	Gamemode<T>["socket"]["clientToServer"],
	Gamemode<T>["socket"]["serverToClient"],
	never,
	SocketData
>;
export type GameServerSocket<T extends GameType = GameType> = Socket<
	Gamemode<T>["socket"]["clientToServer"],
	Gamemode<T>["socket"]["serverToClient"],
	never,
	SocketData
>;
