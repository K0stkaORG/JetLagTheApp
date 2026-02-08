import { Dataset } from "./dataset";
import { GameServer } from "./gameServer";
import { HideAndSeekDataset } from "../gamemodes/hideAndSeek/hideAndSeekDataset";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutDataset } from "../gamemodes/roundabout/roundaboutDataset";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";

export const DatasetFactory = async (server: GameServer): Promise<Dataset> => {
	switch (server.game.type) {
		case "roundabout":
			return RoundaboutDataset.load(server as RoundaboutServer);

		case "hideAndSeek":
			return HideAndSeekDataset.load(server as HideAndSeekServer);

		default:
			throw new Error(`Tried to create dataset for unsupported game type ${server.game.type}`);
	}
};
