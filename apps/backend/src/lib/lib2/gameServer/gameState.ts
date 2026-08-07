import { GameStateSaveFormat, getGameStateSchema, getInitialGameState, TypedPatch } from "@jetlag/shared-types";
import { applyPatches, enablePatches, Patch, produceWithPatches } from "immer";
import z from "zod";
import { db, desc, eq, GameStates } from "~/db";
import { ExtendedError } from "~/lib/errors";
import { GameServer } from "./gameServer";
import { Player } from "./player";

enablePatches();

export type Recipe = (state: GameStateSaveFormat) => void;

export abstract class GameState {
	private lastCommitted: GameStateSaveFormat;
	private pendingPatches: Patch[] = [];

	protected constructor(
		protected readonly server: GameServer,
		protected state: GameStateSaveFormat,
	) {
		this.lastCommitted = state;
	}

	public get get(): GameStateSaveFormat {
		return this.state;
	}

	protected static async loadFromDatabase<T extends GameStateSaveFormat>(server: GameServer): Promise<T> {
		const gameState = await db.query.GameStates.findFirst({
			columns: {
				data: true,
			},
			where: eq(GameStates.gameId, server.game.id),
			orderBy: desc(GameStates.gameTime),
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

	protected handleScheduleSet(recipe: Recipe) {
		this.server.scheduleUnattended("StateUpdate", async () => {
			await this.handleSet(recipe).commit();
		});
	}

	protected handleSet(recipe: Recipe) {
		const [nextState, patches] = produceWithPatches(this.state, recipe);

		// 1. Instantly update in-memory state (this.get reads this updated state)
		this.state = nextState;

		// 2. Queue raw patches across multiple set calls
		this.pendingPatches.push(...patches);

		return {
			commit: () => this.commit(),
		};
	}

	public async commit() {
		if (this.pendingPatches.length === 0) return;

		// Replay all pending patches against the snapshot of the LAST committed state
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, squashedPatches] = produceWithPatches(this.lastCommitted, (draft) => {
			applyPatches(draft, this.pendingPatches);
		});

		// Clear pending queue regardless of output
		this.pendingPatches = [];

		// If intermediate calls mutated and then reverted state back to original, skip DB/Network
		if (squashedPatches.length === 0) return;

		// Persist the current state to DB
		await db.insert(GameStates).values({
			gameId: this.server.game.id,
			gameTime: this.server.timeline.gameTime,
			data: this.state,
		});

		// Update reference marker to point to current committed state
		this.lastCommitted = this.state;

		// Update all players with the squashed patches
		this.notifyPlayersOfStateChange(squashedPatches);
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
