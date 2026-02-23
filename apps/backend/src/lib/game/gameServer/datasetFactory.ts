import { ExtendedError } from "~/lib/errors";
import { HideAndSeekDataset } from "../gamemodes/hideAndSeek/hideAndSeekDataset";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutDataset } from "../gamemodes/roundabout/roundaboutDataset";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { Dataset } from "./dataset";
import { GameServer } from "./gameServer";

export const DatasetFactory = async (server: GameServer): Promise<Dataset> => {
	switch (server.game.type) {
		case "roundabout":
			return RoundaboutDataset.load(server as RoundaboutServer);

		case "hideAndSeek":
			return HideAndSeekDataset.load(server as HideAndSeekServer);

		default:
			throw new ExtendedError(`Tried to create dataset for unsupported game type ${server.game.type}`, {
				service: "gameServer",
				gameServer: server,
			});
	}
};
