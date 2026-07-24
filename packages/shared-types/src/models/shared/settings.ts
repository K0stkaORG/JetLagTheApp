import { getZodDefaultValue } from "../../utility/stringify";
import { GameType } from "../game";
import { HideAndSeekGameSettingsSaveFormat } from "../hideAndSeek/settings";
import { RoundaboutGameSettingsSaveFormat } from "../roundabout/settings";

export * from "../hideAndSeek/settings";
export * from "../roundabout/settings";

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
	getZodDefaultValue(getGameSettingsSchema(gameType));
