import { GameType } from "../game";
import { HideAndSeekGameSettingsSaveFormat } from "./hideAndSeek";
import { RoundaboutGameSettingsSaveFormat } from "./roundabout";

export type GameSettingsSaveFormat = HideAndSeekGameSettingsSaveFormat | RoundaboutGameSettingsSaveFormat;

export const getGameSettingsSchema = (gameType: GameType) => {
	switch (gameType) {
		case "roundabout":
			return RoundaboutGameSettingsSaveFormat;

		case "hideAndSeek":
			return HideAndSeekGameSettingsSaveFormat;

		default:
			throw new Error("Tried to get gameSettings schema for unsupported game type: " + gameType);
	}
};

export const getGameSettingsTemplate = (gameType: GameType): Record<string, any> =>
	getGameSettingsSchema(gameType).def.shape;
