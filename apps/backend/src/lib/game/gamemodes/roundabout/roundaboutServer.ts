import { GameServer, sDataset, sGameSettings } from "../../gameServer/gameServer";

import { User } from "@jetlag/shared-types";
import { IdMap } from "~/lib/idMap";
import { RoundaboutDataset } from "./roundaboutDataset";
import { RoundaboutGameSettings } from "./roundaboutGameSettings";
import { RoundaboutPlayer } from "./roundaboutPlayer";

export class RoundaboutServer extends GameServer {
	public readonly players: IdMap<User["id"], RoundaboutPlayer> = new IdMap();

	public get dataset(): RoundaboutDataset {
		return this[sDataset] as RoundaboutDataset;
	}

	public get gameSettings() {
		return this[sGameSettings] as RoundaboutGameSettings;
	}

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: RoundaboutPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(_player: RoundaboutPlayer): RoundaboutPlayer[] {
		return this.players.items;
	}
}
