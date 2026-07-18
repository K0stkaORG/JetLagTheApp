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

	protected async onEventCallback(event: HideAndSeekGameEvent): Promise<void> {
		switch (event.type) {
			case "gameStarted":
				await new Promise((resolve) => setTimeout(resolve, 1000));
				logger.info("1000ms long event handler");
				await this.eventManager.scheduleEvent({ type: "seekingPhaseStart" }, this.dataset.hideTimeSeconds);
				break;

			case "seekingPhaseStart":
				await this.state.set("gamePhase", "seeking");
				logger.info(`Game ${this.game.id} has entered the seeking phase.`);
				break;
		}
	}
}
