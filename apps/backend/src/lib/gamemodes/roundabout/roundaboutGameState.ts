import { GameStateSaveFormat, RoundaboutGameStateSaveFormat, TypedPatch } from "@jetlag/shared-types";
import { Patch } from "immer";
import { GameState } from "../../gameServer/gameState";
import { Player } from "../../gameServer/player";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameState extends GameState {
	declare protected state: RoundaboutGameStateSaveFormat;

	public get get(): RoundaboutGameStateSaveFormat {
		return this.state;
	}

	public static async load(server: RoundaboutServer): Promise<RoundaboutGameState> {
		const state = await this.loadFromDatabase<RoundaboutGameStateSaveFormat>(server);

		const instance = new RoundaboutGameState(server, state);

		return instance;
	}

	public scheduleSet(recipe: (state: RoundaboutGameStateSaveFormat) => void) {
		this.handleScheduleSet(recipe as (state: GameStateSaveFormat) => void);
	}

	public set(recipe: (state: RoundaboutGameStateSaveFormat) => void) {
		return this.handleSet(recipe as (state: GameStateSaveFormat) => void);
	}

	protected filterStateChangeForPlayer(
		_player: RoundaboutPlayer,
		_patch: TypedPatch<RoundaboutGameStateSaveFormat>,
	): Patch | null {
		return null;
	}

	protected filterStateForPlayer(
		initialState: RoundaboutGameStateSaveFormat,
		_player: Player,
	): RoundaboutGameStateSaveFormat {
		return initialState;
	}
}
