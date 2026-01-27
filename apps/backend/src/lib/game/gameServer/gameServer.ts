import { Game, User } from "@jetlag/shared-types";
import { startServer, stopServer } from "./lifecycle";

import { AppServer } from "../../types";
import { Player } from "./player";
import { Timeline } from "./timeline";
import { addUserAccess } from "./playerManagement";
import { getJoinAdvertisement } from "./restAPI";
import { IdMap } from "~/lib/idMap";

export const sTimeline = Symbol("timeline");

export abstract class GameServer {
	public readonly roomId: string;

	constructor(
		protected readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	public readonly players: IdMap<User["id"], Player> = new IdMap();

	public [sTimeline]: Timeline | undefined = undefined;
	public get timeline() {
		return this[sTimeline]!;
	}

	protected abstract startHook(): Promise<void>;
	public start = startServer;

	protected abstract stopHook(): Promise<void>;
	public stop = stopServer;

	protected abstract addUserAccessHook(player: Player): Promise<void>;
	public addUserAccess = addUserAccess;

	public getJoinAdvertisement = getJoinAdvertisement;

	public async canPauseHook(): Promise<boolean> {
		return true;
	}

	public abstract getPlayerPositionUpdateRecipients(player: Player): Player[];
}
