import { GameStateSaveFormat, RoundaboutGameStateSaveFormat } from "@jetlag/shared-types";
import { Patch } from "immer";
import { GameState } from "../../gameServer/gameState";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameState extends GameState {
	declare protected data: RoundaboutGameStateSaveFormat;

	public static async load(server: RoundaboutServer): Promise<RoundaboutGameState> {
		const data = await this.loadFromDatabase<RoundaboutGameStateSaveFormat>(server);

		const instance = new RoundaboutGameState(server, data);

		return instance;
	}

	public async update(recipe: (state: RoundaboutGameStateSaveFormat) => void) {
		this.handleUpdate(recipe as (state: GameStateSaveFormat) => void);
	}

	protected filterStateChangeForPlayer(_player: RoundaboutPlayer, _patch: Patch): Patch | null {
		return null;
	}

	public get teams() {
		return this.data.teams;
	}
}
