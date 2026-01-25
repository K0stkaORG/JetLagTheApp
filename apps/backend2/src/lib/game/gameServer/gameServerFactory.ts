import { AppServer } from "../../types";
import { Game } from "@jetlag/shared-types";
import { GameServer } from "./gameServer";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";

const getServerInstance = (io: AppServer, game: Game): GameServer => {
	switch (game.type) {
		case "hideAndSeek":
			return new HideAndSeekServer(io, game);

		case "roundabout":
			return new RoundaboutServer(io, game);

		default:
			throw new Error(`Tried to create GameServer for unsupported game type: ${game.type}`);
	}
};

export const GameServerFactory = async (io: AppServer, game: Game): Promise<GameServer> => {
	const server = getServerInstance(io, game);

	await server.start();

	return server;
};
