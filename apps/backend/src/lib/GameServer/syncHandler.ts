import { HidersSyncFrame, SeekersSyncFrame, Team } from "~/types";
import { Server, Socket } from "socket.io";

import { DataStore } from "./dataStore";
import { io } from "../io";

export class SyncHandler {
	private readonly SocketToUserLookup: Map<string, number> = new Map();
	private readonly UserToSocketLookup: Map<number, Socket> = new Map();

	public constructor(private readonly gameId: number, private readonly WS_SERVER: Server) {}

	private get hidersRoomId() {
		return `h-${this.gameId}`;
	}
	private get seekersRoomId() {
		return `s-${this.gameId}`;
	}

	public emitToHiders(syncFrame: HidersSyncFrame) {
		this.WS_SERVER.to(this.hidersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	public emitToSeekers(syncFrame: SeekersSyncFrame) {
		this.WS_SERVER.to(this.seekersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	public emitToAll(syncFrame: Extract<HidersSyncFrame, SeekersSyncFrame>) {
		this.WS_SERVER.to([this.hidersRoomId, this.seekersRoomId]).emit(syncFrame.type, syncFrame.data);
	}

	public close() {
		this.WS_SERVER.to([this.hidersRoomId, this.seekersRoomId]).disconnectSockets();
	}

	public join(socket: Socket, userId: number, data: DataStore) {
		if (this.UserToSocketLookup.has(userId)) {
			const existingSocket = this.UserToSocketLookup.get(userId)!;

			io.server.warn(
				{
					id: this.gameId,
					type: "HideAndSeek",
				},
				`User ${userId} is already connected. Replacing socket ${existingSocket.id} with ${socket.id}`
			);

			existingSocket.emit("replaced");
			existingSocket.disconnect(true);

			this.SocketToUserLookup.delete(existingSocket.id);
		}

		this.UserToSocketLookup.set(userId, socket);

		const team = data.getTeamForUser(userId)!;

		switch (team) {
			case "hiders":
				socket.join(this.hidersRoomId);
				break;
			case "seekers":
				socket.join(this.seekersRoomId);
				break;
			default:
				throw new Error(`Unknown team: ${team}`);
		}

		io.server.logWithSocket(
			{
				id: this.gameId,
				type: "HideAndSeek",
			},
			socket.id,
			`User ${userId} joined team ${team}`
		);

		socket.emit("joined", data.joinPacket);

		socket.on("disconnect", () => {
			io.server.logWithSocket(
				{
					id: this.gameId,
					type: "HideAndSeek",
				},
				socket.id,
				`User ${userId} disconnected`
			);

			this.SocketToUserLookup.delete(socket.id);
			this.UserToSocketLookup.delete(userId);
		});
	}

	public get debug() {
		return {
			hidersRoomId: this.hidersRoomId,
			seekersRoomId: this.seekersRoomId,
			connections: Array.from(this.SocketToUserLookup.entries()).map(([socketId, userId]) => ({
				userId,
				socketId,
			})),
		};
	}
}
