import { GameStateSaveFormat, HideAndSeekGameStateSaveFormat, TypedPatch } from "@jetlag/shared-types";
import { Patch } from "immer";
import { GameState } from "../../gameServer/gameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameState extends GameState {
	declare protected state: HideAndSeekGameStateSaveFormat;

	public get get(): HideAndSeekGameStateSaveFormat {
		return this.state;
	}

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameState> {
		const state = await this.loadFromDatabase<HideAndSeekGameStateSaveFormat>(server);

		const instance = new HideAndSeekGameState(server, state);

		return instance;
	}

	public scheduleSet(recipe: (state: HideAndSeekGameStateSaveFormat) => void) {
		this.handleScheduleSet(recipe as (state: GameStateSaveFormat) => void);
	}

	public set(recipe: (state: HideAndSeekGameStateSaveFormat) => void) {
		return this.handleSet(recipe as (state: GameStateSaveFormat) => void);
	}

	protected filterStateChangeForPlayer(
		player: HideAndSeekPlayer,
		patch: TypedPatch<HideAndSeekGameStateSaveFormat>,
	): Patch | null {
		if (patch.path[0] === "gamePhase") return patch;

		switch (player.team) {
			case "hiders":
				if (patch.path[0] === "hidingZoneCenterId") return patch;
				if (patch.path[0] === "hidingZone") return patch;
				if (patch.path[0] === "hidingSpot") return patch;
				if (patch.path[0] === "hand") return patch;
				break;

			case "seekers":
				if (patch.path[0] === "allPossibleHidingSpots") return patch;
				break;
		}

		return null;
	}

	protected filterStateForPlayer(
		initialState: HideAndSeekGameStateSaveFormat,
		player: HideAndSeekPlayer,
	): HideAndSeekGameStateSaveFormat {
		const state = { ...initialState };

		state.gamePhase = this.state.gamePhase;

		switch (player.team) {
			case "hiders":
				state.hidingZoneCenterId = this.state.hidingZoneCenterId;
				state.hidingZone = this.state.hidingZone;
				state.hidingSpot = this.state.hidingSpot;
				state.hand = this.state.hand;
				break;

			case "seekers":
				state.allPossibleHidingSpots = this.state.allPossibleHidingSpots;
				break;
		}

		return state;
	}
}
