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
import { HideAndSeekDealer } from "./hideAndSeekDealer";
import { HideAndSeekGameState } from "./hideAndSeekGameState";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { getHiderTeamPosition } from "./utility";

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

	public getPlayerPositionUpdateRecipients(player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		if (player.team === "seekers") return this.players.items;

		return this.players.filter((p) => p.team === "hiders");
	}

	protected validateGameSettingsForDataset(): void {}

	protected async onEventCallback(event: HideAndSeekGameEvent) {
		switch (event.type) {
			case "gameStarted":
				// Schedule the start of the seeking phase after the hiding time has elapsed
				await this.eventManager.schedule({ type: "seekingPhaseStart" }, this.dataset.hideTimeSeconds);

				break;

			case "seekingPhaseStart":
				{
					// Get the position of the hider team to determine the nearest hiding spot
					const [hiderTeamPosition, error] = getHiderTeamPosition(this);

					if (error)
						throw new ExtendedError("Failed to get hider team position to pick a hiding spot", {
							service: "gameServer",
							gameServer: this,
							error,
						});

					const hidingSpot = nearestPoint(hiderTeamPosition, this.dataset.gameArea.hidingSpots as Point[]);

					// If the hiders are outside the hiding zone, notify the players how far they are from the nearest hiding zone
					if (hidingSpot.distanceMeters - this.dataset.hidingZoneRadiusMeters > 0)
						this.io.emit("general.notification", {
							message: `Hiders are ${hidingSpot.distanceMeters - this.dataset.hidingZoneRadiusMeters} meters away from the edge of the nearest hiding zone`,
						});

					// Update the game state to enter the seeking phase and set the hiding spot
					await this.state.updateNow((state) => {
						state.gamePhase = "seeking";
						state.hidingSpot = hidingSpot.point;
					});

					logger.info(`Game ${this.fullName} has entered the seeking phase`);
				}
				break;
		}
	}
}
