import { GameType } from "../game";
import { HideAndSeekDatasetSaveFormat } from "./hideAndSeek";
import { RoundaboutDatasetSaveFormat } from "./roundabout";

export type DatasetSaveFormat = HideAndSeekDatasetSaveFormat | RoundaboutDatasetSaveFormat;

export const getDatasetSchema = (gameType: GameType) => {
	switch (gameType) {
		case "roundabout":
			return RoundaboutDatasetSaveFormat;

		case "hideAndSeek":
			return HideAndSeekDatasetSaveFormat;

		default:
			throw new Error("Tried to get dataset schema for unsupported game type: " + gameType);
	}
};

export const getDatasetTemplate = (gameType: GameType): Record<string, any> =>
	Array.from(Object.entries(getDatasetSchema(gameType).shape)).reduce(
		(acc, [key, field]) => {
			acc[key] = field.def.defaultValue;

			return acc;
		},
		{} as Record<string, any>,
	);
