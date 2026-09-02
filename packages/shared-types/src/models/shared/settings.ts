import { assertNever, getZodDefaultValue } from "../../utility";
import { GameType } from "../game";

import { HideAndSeekGameSettingsSaveFormat } from "../hideAndSeek/settings";
import { RoundaboutGameSettingsSaveFormat } from "../roundabout/settings";

export type BaseGameSettingsSaveFormat = Record<never, never>;

export const getGameSettingsSchema = <T extends GameType>(gameType: T) => {
	switch (gameType) {
		case "hideAndSeek":
			return HideAndSeekGameSettingsSaveFormat;

		case "roundabout":
			return RoundaboutGameSettingsSaveFormat;

		default:
			return assertNever(gameType);
	}
};

export const getGameSettingsTemplate = (gameType: GameType): Record<string, unknown> =>
	getZodDefaultValue(getGameSettingsSchema(gameType));
