import { getZodDefaultValue } from "../../utility/stringify";
import { GameType } from "../game";
import { HideAndSeekDatasetSaveFormat } from "../hideAndSeek/dataset";
import { RoundaboutDatasetSaveFormat } from "../roundabout/dataset";

export * from "../hideAndSeek/dataset";
export * from "../roundabout/dataset";

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
	getZodDefaultValue(getDatasetSchema(gameType));
