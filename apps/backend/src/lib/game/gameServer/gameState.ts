import { db, eq, GameStates } from "~/db";

import { GameStateSaveFormat, getGameStateSchema, getInitialGameState, TypedPatch } from "@jetlag/shared-types";
import { enablePatches, Patch, produceWithPatches } from "immer";
import z from "zod";
import { ExtendedError } from "~/lib/errors";
import { GameServer } from "./gameServer";
import { Player } from "./player";

enablePatches();

export abstract class GameState {
	protected constructor(
		protected readonly server: GameServer,
		protected state: GameStateSaveFormat,
	) {}

	protected static async loadFromDatabase<T extends GameStateSaveFormat>(server: GameServer): Promise<T> {
		const gameState = await db.query.GameStates.findFirst({
			columns: {
				data: true,
			},
			where: eq(GameStates.gameId, server.game.id),
		});

		if (!gameState)
			throw new ExtendedError(`Could not find gameState`, {
				service: "gameServer",
				gameServer: server,
			});

		const validatedData = getGameStateSchema(server.game.type).safeParse(gameState.data);

		if (!validatedData.success)
			throw new ExtendedError(`GameState failed validation`, {
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

	protected handleUpdate(recipe: (state: GameStateSaveFormat) => void) {
		this.server.scheduleUnattended("StateUpdate", async () => {
			const [nextState, patches] = produceWithPatches(this.state, recipe);

			this.state = nextState;

			await db.update(GameStates).set({ data: nextState }).where(eq(GameStates.gameId, this.server.game.id));

			this.notifyPlayersOfStateChange(patches);
		});
	}

	protected notifyPlayersOfStateChange(patches: Patch[]) {
		this.server.players.forEach((player) => {
			const filteredPatches = patches
				.map((patch) => this.filterStateChangeForPlayer(player, patch as TypedPatch<GameStateSaveFormat>))
				.filter((patch): patch is Patch => patch !== null);

			if (filteredPatches.length > 0)
				player.socket?.emit("general.state.update", { patches: filteredPatches as [Patch, ...Patch[]] });
		});
	}

	protected abstract filterStateChangeForPlayer(player: Player, patch: TypedPatch<GameStateSaveFormat>): Patch | null;

	protected abstract filterStateForPlayer(initialState: GameStateSaveFormat, player: Player): GameStateSaveFormat;

	public getFilteredStateForPlayer(player: Player): GameStateSaveFormat {
		return this.filterStateForPlayer(getInitialGameState(this.server.game.type), player);
	}
}
