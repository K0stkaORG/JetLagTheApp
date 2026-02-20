import { HideAndSeekGameSettingsSaveFormat } from "@jetlag/shared-types/src/models/gameSettings/hideAndSeek";
import { GameSettings } from "../../gameServer/gameSettings";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameSettings extends GameSettings {
	protected constructor(server: HideAndSeekServer, data: HideAndSeekGameSettingsSaveFormat) {
		super(server, data);
	}

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameSettings> {
		const data = await this.loadFromDatabase<HideAndSeekGameSettingsSaveFormat>(server);

		const instance = new HideAndSeekGameSettings(server, data);

		return instance;
	}
}
