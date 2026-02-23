import { User } from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { HideAndSeekPlayerFactory } from "../gamemodes/hideAndSeek/hideAndSeekPlayerFactory";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { RoundaboutPlayerFactory } from "../gamemodes/roundabout/roundaboutPlayerFactory";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { GameServer } from "./gameServer";
import { Player } from "./player";

export interface IPlayerFactory {
	getById(userId: User["id"]): Promise<Player>;
	getAllForServer(): Promise<Player[]>;
}

export const PlayerFactory = (server: GameServer): IPlayerFactory => {
	switch (server.game.type) {
		case "hideAndSeek":
			return new HideAndSeekPlayerFactory(server as HideAndSeekServer);

		case "roundabout":
			return new RoundaboutPlayerFactory(server as RoundaboutServer);

		default:
			throw new ExtendedError(`No PlayerFactory implementation for game type ${server.game.type}`, {
				service: "gameServer",
				gameServer: server,
			});
	}
};
