import { RoundaboutGameSettingsSaveFormat } from "@jetlag/shared-types/src/models/gameSettings/roundabout";
import { GameSettings } from "../../gameServer/gameSettings";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameSettings extends GameSettings {
	declare protected data: RoundaboutGameSettingsSaveFormat;

	protected constructor(server: RoundaboutServer, data: RoundaboutGameSettingsSaveFormat) {
		super(server, data);
	}

	public static async load(server: RoundaboutServer): Promise<RoundaboutGameSettings> {
		const data = await this.loadFromDatabase<RoundaboutGameSettingsSaveFormat>(server);

		const instance = new RoundaboutGameSettings(server, data);

		return instance;
	}

	public get teams() {
		return this.data.teams;
	}
}
