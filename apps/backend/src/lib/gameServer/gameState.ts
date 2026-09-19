import { db, desc, eq, GameStates } from "@/db";
import {
	BaseGameStateSaveFormat,
	Gamemode,
	Gamemodes,
	GameType,
	getGameStateSchema,
	getInitialGameState,
	TypedPatch,
} from "@jetlag/shared-types";
import { applyPatches, Patch, produceWithPatches } from "immer";
import z from "zod";
import { ExtendedError } from "../errors";
import type { GameServer } from "./gameServer";
import type { Player, TypedPlayer } from "./player";

export type BaseRecipe = (state: BaseGameStateSaveFormat) => void;
export type Recipe<T extends GameType> = (state: Gamemode<T>["state"]) => void;

export abstract class GameState {
	private lastCommitted: BaseGameStateSaveFormat;
	private pendingPatches: Patch[] = [];

	public constructor(
		protected readonly server: GameServer,
		protected state: BaseGameStateSaveFormat,
	) {
		this.lastCommitted = state;
	}

	public get current(): BaseGameStateSaveFormat {
		return this.state;
	}

	public static async loadFromDatabase(server: GameServer): Promise<Gamemodes["state"]> {
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

		return validatedData.data;
	}

	public set(recipe: BaseRecipe) {
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
				.map((patch) => this.filterStateChangeForPlayer(player, patch as TypedPatch<BaseGameStateSaveFormat>))
				.filter((patch): patch is Patch => patch !== null);

			if (filteredPatches.length > 0)
				player.socket?.emit("general.state.update", {
					patches: filteredPatches as [Patch, ...Patch[]],
				});
		});
	}

	protected abstract filterStateChangeForPlayer(
		player: Player,
		patch: TypedPatch<BaseGameStateSaveFormat>,
	): Patch | null;

	protected abstract filterStateForPlayer(
		initialState: BaseGameStateSaveFormat,
		player: Player,
	): BaseGameStateSaveFormat;

	public getFilteredStateForPlayer(player: Player): BaseGameStateSaveFormat {
		return this.filterStateForPlayer(getInitialGameState(this.server.game.type), player);
	}
}

export abstract class TypedGameState<T extends GameType> extends GameState {
	declare protected state: Gamemode<T>["state"];

	public get current(): Gamemode<T>["state"] {
		return this.state;
	}

	declare public set: (recipe: Recipe<T>) => ReturnType<GameState["set"]>;

	protected abstract filterStateChangeForPlayer(player: TypedPlayer<T>, patch: Gamemode<T>["patch"]): Patch | null;

	protected abstract filterStateForPlayer(
		initialState: Gamemode<T>["state"],
		player: TypedPlayer<T>,
	): Gamemode<T>["state"];

	declare public getFilteredStateForPlayer: (player: TypedPlayer<T>) => Gamemode<T>["state"];
}
