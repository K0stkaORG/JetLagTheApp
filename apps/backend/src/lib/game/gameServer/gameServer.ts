import { Game, User } from "@jetlag/shared-types";
import { startServer, stopServer } from "./lifecycle";

import { AppServer } from "../../types";
import { Dataset } from "./dataset";
import { IdMap } from "~/lib/idMap";
import { Player } from "./player";
import { Timeline } from "./timeline";
import { addPlayer } from "./playerManagement";
import { getJoinAdvertisement } from "./restAPI";

export const sTimeline = Symbol("timeline");
export const sDataset = Symbol("dataset");

export abstract class GameServer {
	public readonly roomId: string;

	constructor(
		public readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	public get name() {
		return `${this.game.type} - ${this[sDataset]?.name ?? "Unknown dataset"}`;
	}

	public get fullName() {
		return `${this.game.id} (${this.game.type}): ${this[sDataset]?.name ?? "Unknown dataset"} v${this[sDataset]?.version ?? "?"}`;
	}

	public readonly players: IdMap<User["id"], Player> = new IdMap();

	public [sTimeline]: Timeline | undefined = undefined;
	public get timeline() {
		return this[sTimeline]!;
	}

	public [sDataset]: Dataset | undefined = undefined;
	public get dataset() {
		return this[sDataset]!;
	}

	protected abstract startHook(): Promise<void>;
	public start = startServer;

	protected abstract stopHook(): Promise<void>;
	public stop = stopServer;

	protected abstract addPlayerHook(player: Player): Promise<void>;
	public addPlayer = addPlayer;

	public getLobbyInfo = getJoinAdvertisement;

	public async canBePausedHook(): Promise<boolean> {
		return true;
	}

	public abstract getPlayerPositionUpdateRecipients(player: Player): Player[];
}
