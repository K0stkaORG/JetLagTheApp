import { GameServer, sDataset, sEventManager, sGameSettings, sGameState } from "../../gameServer/gameServer";

import {
	DeepReadonly,
	HideandSeekDatasetParsedFormat,
	HideAndSeekGameEvent,
	HideAndSeekGameSettingsSaveFormat,
	IdMap,
	nearestPoint,
	Point,
	User,
} from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { EventManager } from "../../gameServer/eventManager";
import { HideAndSeekGameState } from "./hideAndSeekGameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { getHiderTeamPosition } from "./utility";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

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

	public getPlayerPositionUpdateRecipients(player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		if (player.team === "seekers") return this.players.items;

		return this.players.filter((p) => p.team === "hiders");
	}

	protected validateGameSettingsForDataset(): void {}

	protected async onEventCallback(event: HideAndSeekGameEvent) {
		switch (event.type) {
			case "gameStarted":
				await this.eventManager.schedule({ type: "seekingPhaseStart" }, this.dataset.hideTimeSeconds);
				break;

			case "seekingPhaseStart":
				{
					const [hiderTeamPosition, error] = getHiderTeamPosition(this);

					if (error)
						throw new ExtendedError("Failed to get hider team position to pick a hiding spot", {
							service: "gameServer",
							gameServer: this,
							error,
						});

					const hidingSpot = nearestPoint(hiderTeamPosition, this.dataset.gameArea.hidingSpots as Point[]);

					if (hidingSpot.distanceMeters - this.dataset.hidingZoneRadiusMeters > 100)
						this.io.emit("general.notification", {
							message: `Hiding spot is more than 100 meters away from hider team position`,
						});

					this.state.update((state) => {
						state.gamePhase = "seeking";
						state.hidingSpot = hidingSpot.point;
					});

					logger.info(`Game ${this.fullName} has entered the seeking phase`);
				}
				break;
		}
	}
}
