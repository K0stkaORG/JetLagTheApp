import { HideAndSeekGameSettings } from "../gamemodes/hideAndSeek/hideAndSeekGameSettings";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutGameSettings } from "../gamemodes/roundabout/roundaboutGameSettings";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { GameServer } from "./gameServer";
import { GameSettings } from "./gameSettings";

export const GameSettingsFactory = async (server: GameServer): Promise<GameSettings> => {
	switch (server.game.type) {
		case "roundabout":
			return RoundaboutGameSettings.load(server as RoundaboutServer);

		case "hideAndSeek":
			return HideAndSeekGameSettings.load(server as HideAndSeekServer);

		default:
			throw new Error(`Tried to create gameSettings for unsupported game type ${server.game.type}`);
	}
};
