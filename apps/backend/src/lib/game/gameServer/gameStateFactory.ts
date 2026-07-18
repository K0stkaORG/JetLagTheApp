import { ExtendedError } from "~/lib/errors";
import { HideAndSeekGameState } from "../gamemodes/hideAndSeek/hideAndSeekGameState";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutGameState } from "../gamemodes/roundabout/roundaboutGameState";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { GameServer } from "./gameServer";
import { GameState } from "./gameState";

export const GameStateFactory = async (server: GameServer): Promise<GameState> => {
	switch (server.game.type) {
		case "roundabout":
			return RoundaboutGameState.load(server as RoundaboutServer);

		case "hideAndSeek":
			return HideAndSeekGameState.load(server as HideAndSeekServer);

		default:
			throw new ExtendedError(`Tried to create gameState for unsupported game type ${server.game.type}`, {
				service: "gameServer",
				gameServer: server,
			});
	}
};
