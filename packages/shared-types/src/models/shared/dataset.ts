import { getZodDefaultValue } from "../../utility/stringify";
import { GameType } from "../game";
import {
	HideAndSeekDatasetInputFormat,
	HideandSeekDatasetParsedFormat,
	parseHideAndSeekDataset,
} from "../hideAndSeek/dataset";
import {
	parseRoundaboutDataset,
	RoundaboutDatasetInputFormat,
	RoundaboutDatasetParsedFormat,
} from "../roundabout/dataset";

export * from "../hideAndSeek/dataset";
export * from "../roundabout/dataset";

export type DatasetInputFormat = HideAndSeekDatasetInputFormat | RoundaboutDatasetInputFormat;
export type DatasetParsedFormat = HideandSeekDatasetParsedFormat | RoundaboutDatasetParsedFormat;

export const getDatasetInputSchema = (gameType: GameType) => {
	switch (gameType) {
		case "roundabout":
			return RoundaboutDatasetInputFormat;

		case "hideAndSeek":
			return HideAndSeekDatasetInputFormat;

		default:
			throw new Error("Tried to get dataset input schema for unsupported game type: " + gameType);
	}
};

export const getDatasetTemplate = (gameType: GameType): Record<string, any> =>
	getZodDefaultValue(getDatasetInputSchema(gameType));

export const parseDataset = (gameType: GameType, data: DatasetInputFormat): DatasetParsedFormat => {
	switch (gameType) {
		case "roundabout":
			return parseRoundaboutDataset(data as RoundaboutDatasetInputFormat);

		case "hideAndSeek":
			return parseHideAndSeekDataset(data as HideAndSeekDatasetInputFormat);

		default:
			throw new Error("Tried to parse dataset for unsupported game type: " + gameType);
	}
};
