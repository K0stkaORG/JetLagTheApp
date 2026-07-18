import { HideAndSeekGameStateSaveFormat } from "@jetlag/shared-types";
import { Get, Paths } from "type-fest";
import { GameState } from "../../gameServer/gameState";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameState extends GameState {
	declare protected data: HideAndSeekGameStateSaveFormat;

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameState> {
		const data = await this.loadFromDatabase<HideAndSeekGameStateSaveFormat>(server);

		const instance = new HideAndSeekGameState(server, data);

		return instance;
	}

	public async set<Path extends Paths<HideAndSeekGameStateSaveFormat>>(
		path: Path,
		value: Get<HideAndSeekGameStateSaveFormat, Path>,
	): Promise<void> {
		await this.setValue(path, value);
	}

	public get gamePhase() {
		return this.data.gamePhase;
	}
}
