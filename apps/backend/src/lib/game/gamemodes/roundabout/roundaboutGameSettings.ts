import { RoundaboutGameSettingsSaveFormat } from "@jetlag/shared-types";
import { GameSettings } from "../../gameServer/gameSettings";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameSettings extends GameSettings {
	declare protected readonly data: RoundaboutGameSettingsSaveFormat;

	public static async load(server: RoundaboutServer): Promise<RoundaboutGameSettings> {
		const data = await this.loadFromDatabase<RoundaboutGameSettingsSaveFormat>(server);

		const instance = new RoundaboutGameSettings(server, data);

		return instance;
	}

	public get teams() {
		return this.data.teams;
	}
}
