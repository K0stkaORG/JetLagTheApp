import {
	BaseDatasetParsedFormat,
	BaseGameEvent,
	BaseGameSettingsSaveFormat,
	Dataset,
	DatasetMetadata,
	formatGameType,
	Game,
	Gamemode,
	GameType,
	IdMap,
	User,
} from "@jetlag/shared-types";
import { loadServer, startServer, stopServer } from "./lifecycle";

import { BaseGameServerIO, GameServerIO } from "../types";
import { CommandQueue } from "./commandQueue";
import { EventManager, TypedEventManager } from "./eventManager";
import { GameServerWorker } from "./gameServerWorker";
import { GameState, TypedGameState } from "./gameState";
import { Player, TypedPlayer } from "./player";
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
		protected readonly _io: BaseGameServerIO,
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

	public get io(): ReturnType<BaseGameServerIO["in"]> {
		return this._io.in(this.roomId);
	}

	public readonly players: IdMap<User["id"], Player> = new IdMap();
	public abstract readonly worker: GameServerWorker;

	public [sTimeline]: Timeline | undefined = undefined;
	public get timeline() {
		return this[sTimeline]!;
	}

	public [sDatasetMetadata]: RuntimeDatasetMetadata | undefined = undefined;
	public get datasetMetadata(): RuntimeDatasetMetadata {
		return this[sDatasetMetadata]!;
	}

	public [sDataset]: BaseDatasetParsedFormat | undefined = undefined;
	public get dataset(): BaseDatasetParsedFormat {
		return this[sDataset]!;
	}

	public [sGameSettings]: BaseGameSettingsSaveFormat | undefined = undefined;
	public get gameSettings(): BaseGameSettingsSaveFormat {
		return this[sGameSettings]!;
	}

	public [sGameState]: GameState | undefined = undefined;
	public get state(): GameState {
		return this[sGameState]!;
	}

	public [sQueue]: CommandQueue | undefined = undefined;
	public schedule: CommandQueue["enqueue"] = async (tag, command) => {
		return this[sQueue]!.enqueue(tag, command);
	};
	public scheduleUnattended: CommandQueue["enqueueUnattended"] = (tag, command) => {
		return this[sQueue]!.enqueueUnattended(tag, command);
	};

	public [sEventManager]: EventManager | undefined = undefined;
	public get eventManager(): EventManager {
		return this[sEventManager]!;
	}

	public load = loadServer;

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

	public abstract propagatePositionUpdate(from: Player, to: Player): boolean;

	protected abstract validateGameSettingsForDataset(): void;

	protected abstract onEventCallback(event: BaseGameEvent): Promise<void>;
}

export abstract class TypedGameServer<T extends GameType> extends GameServer {
	declare public readonly game: Game<T>;
	declare public readonly players: IdMap<User["id"], TypedPlayer<T>>;
	declare public readonly worker: GameServerWorker<T>;

	public get io(): ReturnType<GameServerIO<T>["in"]> {
		return this._io.in(this.roomId);
	}

	public get dataset(): Gamemode<T>["dataset"]["parsed"] {
		return this[sDataset] as Gamemode<T>["dataset"]["parsed"];
	}

	public get gameSettings(): Gamemode<T>["settings"] {
		return this[sGameSettings] as Gamemode<T>["settings"];
	}

	public get state(): TypedGameState<T> {
		return this[sGameState] as TypedGameState<T>;
	}

	public get eventManager(): TypedEventManager<T> {
		return this[sEventManager] as TypedEventManager<T>;
	}

	protected abstract addPlayerHook(player: TypedPlayer<T>): Promise<void>;
	public abstract propagatePositionUpdate(from: TypedPlayer<T>, to: TypedPlayer<T>): boolean;
	protected abstract onEventCallback(event: Gamemode<T>["event"]): Promise<void>;
}
