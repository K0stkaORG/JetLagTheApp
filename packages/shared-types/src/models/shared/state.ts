import { assertNever } from "../../utility";
import { GameType } from "../game";

import { HideAndSeekGameStateSaveFormat, HideAndSeekInitialGameState } from "../hideAndSeek/state";
import { RoundaboutGameStateSaveFormat, RoundaboutInitialGameState } from "../roundabout/state";
import { Gamemode } from "./gamemode";

export type BaseGameStateSaveFormat = Record<never, never>;

export const getGameStateSchema = <T extends GameType>(gameType: T) => {
	switch (gameType) {
		case "hideAndSeek":
			return HideAndSeekGameStateSaveFormat;

		case "roundabout":
			return RoundaboutGameStateSaveFormat;

		default:
			return assertNever(gameType);
	}
};

export const getInitialGameState = <T extends GameType>(gameType: T): Gamemode<T>["state"] => {
	switch (gameType) {
		case "hideAndSeek":
			return HideAndSeekInitialGameState as Gamemode<T>["state"];

		case "roundabout":
			return RoundaboutInitialGameState as Gamemode<T>["state"];

		default:
			return assertNever(gameType);
	}
};
