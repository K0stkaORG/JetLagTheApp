import { Game, User } from "@jetlag/shared-types";
import { startServer, stopServer } from "./lifecycleHelpers";

import { AppServer } from "../../types";
import { getJoinAdvertisement } from "./restAPIHelpers";

const symbols = {
	players: Symbol("players"),
};

export abstract class GameServer {
	protected readonly SYMBOLS = symbols;

	public readonly roomId: string;

	public [symbols.players] = new Map<User["id"], User>();
	public get players() {
		return this[symbols.players];
	}

	constructor(
		protected readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	protected abstract startHook(): Promise<void>;
	public start = startServer;

	protected abstract stopHook(): Promise<void>;
	public stop = stopServer;

	public getJoinAdvertisement = getJoinAdvertisement;
}
