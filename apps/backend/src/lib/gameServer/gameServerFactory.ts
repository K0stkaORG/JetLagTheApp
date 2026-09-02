import { assertNever, Game } from "@jetlag/shared-types";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { BaseGameServerIO } from "../types";
import { GameServer } from "./gameServer";

const getServerInstance = (io: BaseGameServerIO, game: Game): GameServer => {
	switch (game.type) {
		case "hideAndSeek":
			return new HideAndSeekServer(io, game);

		case "roundabout":
			return new RoundaboutServer(io, game);

		default:
			return assertNever(game.type);
	}
};

export const GameServerFactory = async (io: BaseGameServerIO, game: Game, setter: (server: GameServer) => void) => {
	const server = getServerInstance(io, game);

	await server.load();

	setter(server);

	await server.start();
};
