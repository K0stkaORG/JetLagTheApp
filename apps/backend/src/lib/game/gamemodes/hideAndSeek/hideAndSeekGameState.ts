import { GameStateSaveFormat, HideAndSeekGameStateSaveFormat } from "@jetlag/shared-types";
import { Patch } from "immer";
import { GameState } from "../../gameServer/gameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameState extends GameState {
	declare protected data: HideAndSeekGameStateSaveFormat;

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameState> {
		const data = await this.loadFromDatabase<HideAndSeekGameStateSaveFormat>(server);

		const instance = new HideAndSeekGameState(server, data);

		return instance;
	}

	public update(recipe: (state: HideAndSeekGameStateSaveFormat) => void) {
		this.handleUpdate(recipe as (state: GameStateSaveFormat) => void);
	}

	protected filterStateChangeForPlayer(_player: HideAndSeekPlayer, _patch: Patch): Patch | null {
		return null;
	}

	public get gamePhase() {
		return this.data.gamePhase;
	}
}
