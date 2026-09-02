import { assertNever, getZodDefaultValue } from "../../utility";
import { GameType } from "../game";

import { HideAndSeekDatasetInputFormat, parseHideAndSeekDataset } from "../hideAndSeek/dataset";
import { parseRoundaboutDataset, RoundaboutDatasetInputFormat } from "../roundabout/dataset";
import { Gamemode } from "./gamemode";

export type BaseDatasetInputFormat = Record<never, never>;
export type BaseDatasetParsedFormat = Record<never, never>;

export const getDatasetInputSchema = (gameType: GameType) => {
	switch (gameType) {
		case "hideAndSeek":
			return HideAndSeekDatasetInputFormat;

		case "roundabout":
			return RoundaboutDatasetInputFormat;

		default:
			return assertNever(gameType);
	}
};

export const getDatasetTemplate = (gameType: GameType): Record<string, unknown> =>
	getZodDefaultValue(getDatasetInputSchema(gameType));

export const parseDataset = <T extends GameType>(
	gameType: T,
	data: Gamemode<T>["dataset"]["input"],
): Gamemode<T>["dataset"]["parsed"] => {
	switch (gameType) {
		case "hideAndSeek":
			return parseHideAndSeekDataset(data as HideAndSeekDatasetInputFormat) as Gamemode<T>["dataset"]["parsed"];

		case "roundabout":
			return parseRoundaboutDataset(data as RoundaboutDatasetInputFormat) as Gamemode<T>["dataset"]["parsed"];

		default:
			return assertNever(gameType);
	}
};
