import { Game } from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { AppServer } from "../types";
import { GameServer } from "./gameServer";

const getServerInstance = (io: AppServer, game: Game): GameServer => {
	switch (game.type) {
		case "hideAndSeek":
			return new HideAndSeekServer(io, game);

		case "roundabout":
			return new RoundaboutServer(io, game);

		default:
			throw new ExtendedError(`Tried to create GameServer for unsupported game type ${game.type}`, {
				service: "gameServer",
				gameServer: game.id,
			});
	}
};

export const GameServerFactory = async (io: AppServer, game: Game, setter: (server: GameServer) => void) => {
	const server = getServerInstance(io, game);

	await server.load();

	setter(server);

	await server.start();
};
