import { GameStateSaveFormat, HideAndSeekGameStateSaveFormat, TypedPatch } from "@jetlag/shared-types";
import { Patch } from "immer";
import { GameState } from "../../gameServer/gameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameState extends GameState {
	declare protected state: HideAndSeekGameStateSaveFormat;

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameState> {
		const state = await this.loadFromDatabase<HideAndSeekGameStateSaveFormat>(server);

		const instance = new HideAndSeekGameState(server, state);

		return instance;
	}

	public update(recipe: (state: HideAndSeekGameStateSaveFormat) => void) {
		this.handleUpdate(recipe as (state: GameStateSaveFormat) => void);
	}

	protected filterStateChangeForPlayer(
		player: HideAndSeekPlayer,
		patch: TypedPatch<HideAndSeekGameStateSaveFormat>,
	): Patch | null {
		if (patch.path[0] === "gamePhase") return patch;

		switch (player.team) {
			case "hiders":
				if (patch.path[0] === "hidingSpot") return patch;
				break;

			case "seekers":
				break;
		}

		return null;
	}

	protected filterStateForPlayer(
		initialState: HideAndSeekGameStateSaveFormat,
		player: HideAndSeekPlayer,
	): HideAndSeekGameStateSaveFormat {
		initialState.gamePhase = this.state.gamePhase;

		switch (player.team) {
			case "hiders":
				initialState.hidingSpot = this.state.hidingSpot;
				break;

			case "seekers":
				break;
		}

		return initialState;
	}

	public get gamePhase() {
		return this.state.gamePhase;
	}

	public get hidingSpot() {
		return this.state.hidingSpot;
	}
}
