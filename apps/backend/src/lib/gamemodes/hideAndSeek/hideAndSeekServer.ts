import { GameServer, sDataset, sEventManager, sGameSettings, sGameState } from "~/lib/gameServer/gameServer";

import {
	DeepReadonly,
	HideandSeekDatasetParsedFormat,
	HideAndSeekGameEvent,
	HideAndSeekGameSettingsSaveFormat,
	IdMap,
	User,
} from "@jetlag/shared-types";
import { EventManager } from "~/lib/gameServer/eventManager";
import { onEventCallback } from "./eventHandlers";
import { HideAndSeekDealer } from "./hideAndSeekDealer";
import { HideAndSeekGameState } from "./hideAndSeekGameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

	public readonly dealer = new HideAndSeekDealer(this);

	public get dataset(): DeepReadonly<HideandSeekDatasetParsedFormat> {
		return this[sDataset] as HideandSeekDatasetParsedFormat;
	}

	public get gameSettings(): DeepReadonly<HideAndSeekGameSettingsSaveFormat> {
		return this[sGameSettings] as HideAndSeekGameSettingsSaveFormat;
	}

	public get state() {
		return this[sGameState] as HideAndSeekGameState;
	}

	public get eventManager() {
		return this[sEventManager]! as EventManager<HideAndSeekGameEvent>;
	}

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: HideAndSeekPlayer): Promise<void> {}

	public propagatePositionUpdate(from: HideAndSeekPlayer, to: HideAndSeekPlayer): boolean {
		// Propagate position if its from a seeker to anyone or from anyone to hider
		return from.team === "seekers" || to.team === "hiders";
	}

	protected validateGameSettingsForDataset(): void {}

	protected onEventCallback = onEventCallback;
}
