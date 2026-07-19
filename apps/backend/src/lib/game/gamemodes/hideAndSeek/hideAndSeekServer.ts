import { GameServer, sDataset, sEventManager, sGameSettings, sGameState } from "../../gameServer/gameServer";

import { HideAndSeekGameEvent, User } from "@jetlag/shared-types";
import { IdMap } from "~/lib/idMap";
import { logger } from "~/lib/logger";
import { EventManager } from "../../gameServer/eventManager";
import { HideAndSeekDataset } from "./hideAndSeekDataset";
import { HideAndSeekGameSettings } from "./hideAndSeekGameSettings";
import { HideAndSeekGameState } from "./hideAndSeekGameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

	public get dataset(): HideAndSeekDataset {
		return this[sDataset] as HideAndSeekDataset;
	}

	public get gameSettings() {
		return this[sGameSettings] as HideAndSeekGameSettings;
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

	public getPlayerPositionUpdateRecipients(_player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		return this.players.items;
	}

	protected validateGameSettingsForDataset(): void {}

	protected async onEventCallback(event: HideAndSeekGameEvent) {
		switch (event.type) {
			case "gameStarted":
				await this.eventManager.scheduleEvent({ type: "seekingPhaseStart" }, this.dataset.hideTimeSeconds);
				break;

			case "seekingPhaseStart":
				this.state.update((state) => {
					state.gamePhase = "seeking";
				});
				logger.info(`Game ${this.fullName} has entered the seeking phase`);
				break;
		}
	}
}
