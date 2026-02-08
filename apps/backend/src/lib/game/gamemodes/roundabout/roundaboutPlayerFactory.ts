import { GameAccess, PlayerPositions, Users, db, desc, eq } from "~/db";
import { NULL_CORDS, User } from "@jetlag/shared-types";

import type { IPlayerFactory } from "../../gameServer/playerFactory";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutPlayerFactory implements IPlayerFactory {
	constructor(private readonly server: RoundaboutServer) {}

	public async getById(userId: User["id"]): Promise<RoundaboutPlayer> {
		const player = await db.query.Users.findFirst({
			columns: {
				id: true,
				nickname: true,
				colors: true,
			},
			where: eq(Users.id, userId),
			with: {
				playerPositions: {
					columns: {
						cords: true,
						gameTime: true,
					},
					limit: 1,
					where: eq(PlayerPositions.gameId, this.server.game.id),
					orderBy: desc(PlayerPositions.gameTime),
				},
				gameAccess: {
					where: eq(GameAccess.gameId, this.server.game.id),
					columns: {
						id: true,
					},
				},
			},
		});

		if (!player || player.gameAccess.length === 0)
			throw new Error(`Player with ID ${userId} not found in game ${this.server.fullName}`);

		const { playerPositions, gameAccess: _gameAccess, ...user } = player;

		return playerPositions[0]
			? new RoundaboutPlayer(this.server, user, playerPositions[0].cords, playerPositions[0].gameTime)
			: new RoundaboutPlayer(this.server, user, NULL_CORDS, 0);
	}

	public async getAllForServer(): Promise<RoundaboutPlayer[]> {
		const players = await db.query.GameAccess.findMany({
			columns: {},
			where: eq(GameAccess.gameId, this.server.game.id),
			with: {
				user: {
					columns: {
						id: true,
						nickname: true,
						colors: true,
					},
					with: {
						playerPositions: {
							columns: {
								cords: true,
								gameTime: true,
							},
							limit: 1,
							where: eq(PlayerPositions.gameId, this.server.game.id),
							orderBy: desc(PlayerPositions.gameTime),
						},
					},
				},
			},
		});

		return players.map(({ user: { playerPositions, ...user } }) =>
			playerPositions[0]
				? new RoundaboutPlayer(this.server, user, playerPositions[0].cords, playerPositions[0].gameTime)
				: new RoundaboutPlayer(this.server, user, NULL_CORDS, 0),
		);
	}
}
