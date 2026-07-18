import { GameType } from "../game";
import { HideAndSeekGameStateSaveFormat, HideAndSeekInitialGameState } from "./hideAndSeek";
import { RoundaboutGameStateSaveFormat, RoundaboutInitialGameState } from "./roundabout";

export type GameStateSaveFormat = HideAndSeekGameStateSaveFormat | RoundaboutGameStateSaveFormat;

export const getGameStateSchema = (gameType: GameType) => {
	switch (gameType) {
		case "roundabout":
			return RoundaboutGameStateSaveFormat;

		case "hideAndSeek":
			return HideAndSeekGameStateSaveFormat;

		default:
			throw new Error("Tried to get gameState schema for unsupported game type: " + gameType);
	}
};

export const getInitialGameState = (gameType: GameType): GameStateSaveFormat => {
	switch (gameType) {
		case "roundabout":
			return RoundaboutInitialGameState;

		case "hideAndSeek":
			return HideAndSeekInitialGameState;

		default:
			throw new Error("Tried to get initial gameState for unsupported game type: " + gameType);
	}
};
