import { Game, User } from "@jetlag/shared-types";
import { startServer, stopServer } from "./lifecycleHelpers";

import { AppServer } from "../../types";
import { Timeline } from "./timeline";
import { getJoinAdvertisement } from "./restAPIHelpers";

export const sPlayers = Symbol("players");
export const sTimeline = Symbol("timeline");

export abstract class GameServer {
	public readonly roomId: string;

	constructor(
		protected readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	public [sPlayers] = new Map<User["id"], User>();
	public get players() {
		return this[sPlayers];
	}

	public [sTimeline]: Timeline | undefined = undefined;
	public get timeline() {
		return this[sTimeline]!;
	}

	protected abstract startHook(): Promise<void>;
	public start = startServer;

	protected abstract stopHook(): Promise<void>;
	public stop = stopServer;

	public getJoinAdvertisement = getJoinAdvertisement;
}
