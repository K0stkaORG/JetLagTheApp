import { assertNever } from "@jetlag/shared-types";
import { HideAndSeekGameState } from "../gamemodes/hideAndSeek/hideAndSeekGameState";
import { RoundaboutGameState } from "../gamemodes/roundabout/roundaboutGameState";
import { GameServer } from "./gameServer";
import { GameState } from "./gameState";

export const GameStateFactory = async (server: GameServer): Promise<GameState> => {
	const state = await GameState.loadFromDatabase(server);

	switch (server.game.type) {
		case "hideAndSeek":
			return new HideAndSeekGameState(server, state);

		case "roundabout":
			return new RoundaboutGameState(server, state);

		default:
			return assertNever(server.game.type);
	}
};
