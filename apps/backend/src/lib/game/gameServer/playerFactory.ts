import { GameServer } from "./gameServer";
import { HideAndSeekPlayerFactory } from "../gamemodes/hideAndSeek/hideAndSeekPlayerFactory";
import { HideAndSeekServer } from "../gamemodes/hideAndSeek/hideAndSeekServer";
import { Player } from "./player";
import { RoundaboutPlayerFactory } from "../gamemodes/roundabout/roundaboutPlayerFactory";
import { RoundaboutServer } from "../gamemodes/roundabout/roundaboutServer";
import { User } from "@jetlag/shared-types";

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
			throw new Error(`No PlayerFactory implementation for game type ${server.game.type}`);
	}
};
