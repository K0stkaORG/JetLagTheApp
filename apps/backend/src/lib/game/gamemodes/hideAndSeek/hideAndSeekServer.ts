import { GameServer, sDataset, sGameSettings } from "../../gameServer/gameServer";

import { User } from "@jetlag/shared-types";
import { IdMap } from "~/lib/idMap";
import { HideAndSeekDataset } from "./hideAndSeekDataset";
import { HideAndSeekGameSettings } from "./hideAndSeekGameSettings";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

	public get dataset(): HideAndSeekDataset {
		return this[sDataset] as HideAndSeekDataset;
	}

	public get gameSettings() {
		return this[sGameSettings] as HideAndSeekGameSettings;
	}

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: HideAndSeekPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(_player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		return this.players.items;
	}
}
