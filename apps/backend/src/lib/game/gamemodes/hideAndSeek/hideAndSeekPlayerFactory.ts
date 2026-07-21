import { NULL_POINT, toPoint, User } from "@jetlag/shared-types";
import { db, desc, eq, GameAccess, PlayerPositions, Users } from "~/db";

import { ExtendedError } from "~/lib/errors";
import type { IPlayerFactory } from "../../gameServer/playerFactory";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekPlayerFactory implements IPlayerFactory {
	constructor(private readonly server: HideAndSeekServer) {}

	public async getById(userId: User["id"]): Promise<HideAndSeekPlayer> {
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
			throw new ExtendedError(`Player with ID ${userId} not found`, {
				service: "gameServer",
				gameServer: this.server,
			});

		const user = {
			id: player.id,
			nickname: player.nickname,
			colors: player.colors,
		};

		const team = this.server.gameSettings.hiders.includes(player.nickname) ? "hiders" : "seekers";

		return player.playerPositions[0]
			? new HideAndSeekPlayer(
					this.server,
					user,
					toPoint(player.playerPositions[0].cords),
					player.playerPositions[0].gameTime,
					team,
				)
			: new HideAndSeekPlayer(this.server, user, NULL_POINT, 0, team);
	}

	public async getAllForServer(): Promise<HideAndSeekPlayer[]> {
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

		return players.map(({ user: { playerPositions, ...user } }) => {
			const team = this.server.gameSettings.hiders.includes(user.nickname) ? "hiders" : "seekers";

			return playerPositions[0]
				? new HideAndSeekPlayer(
						this.server,
						user,
						toPoint(playerPositions[0].cords),
						playerPositions[0].gameTime,
						team,
					)
				: new HideAndSeekPlayer(this.server, user, NULL_POINT, 0, team);
		});
	}
}
