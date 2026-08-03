import {
	Dataset,
	DatasetMetadata,
	DatasetParsedFormat,
	DeepReadonly,
	formatGameType,
	Game,
	GameEvent,
	GameSettingsSaveFormat,
	IdMap,
	User,
} from "@jetlag/shared-types";
import { startServer, stopServer } from "./lifecycle";

import { AppServer } from "../../types";
import { CommandQueue } from "./commandQueue";
import { EventManager } from "./eventManager";
import { GameState } from "./gameState";
import { Player } from "./player";
import { addPlayer } from "./playerManagement";
import { getLobbyInfo } from "./restAPI";
import { Timeline } from "./timeline";

export const sTimeline = Symbol("timeline");
export const sDatasetMetadata = Symbol("datasetMetadata");
export const sDataset = Symbol("dataset");
export const sGameSettings = Symbol("gameSettings");
export const sGameState = Symbol("gameState");
export const sQueue = Symbol("queue");
export const sEventManager = Symbol("eventManager");

type RuntimeDatasetMetadata = Pick<DatasetMetadata, "name"> &
	Pick<Dataset, "version"> & {
		datasetId: Dataset["id"];
		metadataId: DatasetMetadata["id"];
	};

export abstract class GameServer {
	public readonly roomId: string;

	constructor(
		public readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	public get name() {
		return `${formatGameType(this.game.type)} - ${this[sDatasetMetadata]?.name ?? "Unknown dataset"}`;
	}

	public get fullName() {
		return `#${this.game.id} (${formatGameType(this.game.type)} - ${this[sDatasetMetadata]?.name ?? "Unknown dataset"} v${this[sDatasetMetadata]?.version ?? "?"})`;
	}

	public readonly players: IdMap<User["id"], Player> = new IdMap();

	public [sTimeline]: Timeline | undefined = undefined;
	public get timeline() {
		return this[sTimeline]!;
	}

	public [sDatasetMetadata]: RuntimeDatasetMetadata | undefined = undefined;
	public get datasetMetadata(): DeepReadonly<RuntimeDatasetMetadata> {
		return this[sDatasetMetadata]!;
	}

	public [sDataset]: DatasetParsedFormat | undefined = undefined;
	public get dataset(): DeepReadonly<DatasetParsedFormat> {
		return this[sDataset]!;
	}

	public [sGameSettings]: GameSettingsSaveFormat | undefined = undefined;
	public get gameSettings(): DeepReadonly<GameSettingsSaveFormat> {
		return this[sGameSettings]!;
	}

	public [sGameState]: GameState | undefined = undefined;
	public get state() {
		return this[sGameState]!;
	}

	public [sQueue]: CommandQueue | undefined = undefined;
	public schedule: CommandQueue["enqueue"] = async (tag, command) => {
		return this[sQueue]!.enqueue(tag, command);
	};
	public scheduleUnattended: CommandQueue["enqueueUnattended"] = (tag, command) => {
		return this[sQueue]!.enqueueUnattended(tag, command);
	};

	public [sEventManager]: EventManager<GameEvent> | undefined = undefined;
	public get eventManager() {
		return this[sEventManager]!;
	}

	protected abstract startHook(): Promise<void>;
	public start = startServer;

	protected abstract stopHook(): Promise<void>;
	public stop = stopServer;

	protected abstract addPlayerHook(player: Player): Promise<void>;
	public addPlayer = addPlayer;

	public getLobbyInfo = getLobbyInfo;

	public canBePaused(): boolean {
		return true;
	}

	public abstract getPlayerPositionUpdateRecipients(player: Player): Player[];

	protected abstract validateGameSettingsForDataset(): void;

	protected abstract onEventCallback(event: GameEvent): Promise<void>;
}
