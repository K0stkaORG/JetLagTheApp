import { db, eq, GameStates, sql } from "~/db";

import { GameStateSaveFormat, getGameStateSchema } from "@jetlag/shared-types";
import { set } from "lodash";
import { Get, Paths } from "type-fest";
import z from "zod";
import { ExtendedError } from "~/lib/errors";
import { GameServer } from "./gameServer";

export abstract class GameState {
	protected constructor(
		protected readonly server: GameServer,
		protected readonly data: GameStateSaveFormat,
	) {}

	protected static async loadFromDatabase<T extends GameStateSaveFormat>(server: GameServer): Promise<T> {
		const gameState = await db.query.GameStates.findFirst({
			columns: {
				data: true,
			},
			where: eq(GameStates.gameId, server.game.id),
		});

		if (!gameState)
			throw new ExtendedError(`Could not find gameState with id ${server.game.id}`, {
				service: "gameServer",
				gameServer: server,
			});

		const validatedData = getGameStateSchema(server.game.type).safeParse(gameState.data);

		if (!validatedData.success)
			throw new ExtendedError(`GameState with id ${server.game.id} failed validation`, {
				service: "gameServer",
				gameServer: server,
				error: z.prettifyError(validatedData.error),
			});

		return validatedData.data as T;
	}

	public static async load(server: GameServer): Promise<GameState> {
		throw new ExtendedError(`gameState.load() for server type ${server.game.type} is not implemented.`, {
			service: "gameServer",
			gameServer: server,
		});
	}

	protected async setValue<Path extends Paths<GameStateSaveFormat>>(
		path: Path,
		value: Get<GameStateSaveFormat, Path>,
	): Promise<void> {
		this.server.scheduleUnattended(() => set(this.data, path, value));

		await db
			.update(GameStates)
			.set({
				data: sql`jsonb_set(${GameStates.data}, ${`{"${path.split(".").join('","')}"}`}, ${JSON.stringify(value)})`,
			})
			.where(eq(GameStates.gameId, this.server.game.id))
			.execute();
	}
}
