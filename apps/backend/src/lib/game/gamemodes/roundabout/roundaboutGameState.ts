import { RoundaboutGameStateSaveFormat } from "@jetlag/shared-types/src/models/gameState/roundabout";
import { Get, Paths } from "type-fest";
import { GameState } from "../../gameServer/gameState";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameState extends GameState {
	declare protected data: RoundaboutGameStateSaveFormat;

	public static async load(server: RoundaboutServer): Promise<RoundaboutGameState> {
		const data = await this.loadFromDatabase<RoundaboutGameStateSaveFormat>(server);

		const instance = new RoundaboutGameState(server, data);

		return instance;
	}

	public async set<Path extends Paths<RoundaboutGameStateSaveFormat>>(
		path: Path,
		value: Get<RoundaboutGameStateSaveFormat, Path>,
	): Promise<void> {
		await this.setValue(path, value);
	}

	public get teams() {
		return this.data.teams;
	}
}
