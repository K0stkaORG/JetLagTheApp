import { GameServer, sDataset, sEventManager, sGameSettings, sGameState } from "../../gameServer/gameServer";

import {
	DeepReadonly,
	IdMap,
	RoundaboutDatasetParsedFormat,
	RoundaboutGameEvent,
	RoundaboutGameSettingsSaveFormat,
	User,
} from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { EventManager } from "../../gameServer/eventManager";
import { RoundaboutGameState } from "./roundaboutGameState";
import { RoundaboutPlayer } from "./roundaboutPlayer";

export class RoundaboutServer extends GameServer {
	public readonly players: IdMap<User["id"], RoundaboutPlayer> = new IdMap();

	public get dataset(): DeepReadonly<RoundaboutDatasetParsedFormat> {
		return this[sDataset] as RoundaboutDatasetParsedFormat;
	}

	public get gameSettings(): DeepReadonly<RoundaboutGameSettingsSaveFormat> {
		return this[sGameSettings] as RoundaboutGameSettingsSaveFormat;
	}

	public get state() {
		return this[sGameState] as RoundaboutGameState;
	}

	public get eventManager() {
		return this[sEventManager]! as EventManager<RoundaboutGameEvent>;
	}

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: RoundaboutPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(_player: RoundaboutPlayer): RoundaboutPlayer[] {
		return this.players.items;
	}

	protected validateGameSettingsForDataset(): void {
		if (this.gameSettings.teams.length !== this.dataset.spawns.length)
			throw new ExtendedError(
				`The number of teams in the game settings (${this.gameSettings.teams.length}) does not match the number of spawns in the dataset (${this.dataset.spawns.length}).`,
				{
					service: "gameServer",
					gameServer: this,
				},
			);
	}

	protected async onEventCallback(_event: RoundaboutGameEvent) {}
}
