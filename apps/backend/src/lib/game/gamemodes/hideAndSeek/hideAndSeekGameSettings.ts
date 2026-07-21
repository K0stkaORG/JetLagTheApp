import { HideAndSeekGameSettingsSaveFormat } from "@jetlag/shared-types";
import { GameSettings } from "../../gameServer/gameSettings";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameSettings extends GameSettings {
	declare protected readonly data: HideAndSeekGameSettingsSaveFormat;

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekGameSettings> {
		const data = await this.loadFromDatabase<HideAndSeekGameSettingsSaveFormat>(server);

		const instance = new HideAndSeekGameSettings(server, data);

		return instance;
	}

	public get hiders() {
		return this.data.hiders;
	}
}
