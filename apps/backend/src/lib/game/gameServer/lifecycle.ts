import { GameAccess, PlayerPositions, db, desc, eq } from "~/db";
import { GameServer, sPlayers, sTimeline } from "./gameServer";

import { NULL_CORDS } from "@jetlag/shared-types";
import { Player } from "./player";
import { Timeline } from "./timeline";
import { logger } from "~/lib/logger";

async function loadPlayers(this: GameServer) {
	const players = await db.query.GameAccess.findMany({
		where: eq(GameAccess.gameId, this.game.id),
		columns: {},
		with: {
			user: {
				columns: {
					id: true,
					nickname: true,
					colors: true,
				},
				with: {
					playerPositions: {
						limit: 1,
						where: eq(PlayerPositions.gameId, this.game.id),
						orderBy: desc(PlayerPositions.gameTime),
						columns: {
							cords: true,
							gameTime: true,
						},
					},
				},
			},
		},
	});

	players
		.map(({ user: { playerPositions, ...user } }) =>
			playerPositions[0]
				? new Player(this, user, playerPositions[0].cords, playerPositions[0].gameTime)
				: new Player(this, user, NULL_CORDS, 0),
		)
		.forEach((player) => this[sPlayers].set(player.user.id, player));
}

async function loadTimeline(this: GameServer) {
	const timeline = await Timeline.load(this);

	this[sTimeline] = timeline;
}

export async function startServer(this: GameServer) {
	(await Promise.allSettled([loadPlayers.call(this), loadTimeline.call(this)])).forEach((result) => {
		if (result.status === "rejected")
			throw new Error(
				`Error occurred when starting game server for game ${this.game.id} (${this.game.type}): ` +
					result.reason,
			);
	});

	await this.startHook();

	logger.info(`Started game server for game ${this.game.id} (${this.game.type})`);
}

export async function stopServer(this: GameServer) {
	logger.info(`Shutting down game server for game ${this.game.id} (${this.game.type})`);

	this.timeline.stopHook();

	await this.stopHook();

	this.io.socketsLeave(this.roomId);
}
