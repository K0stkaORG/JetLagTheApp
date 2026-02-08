import { GameServer, sDataset } from "../../gameServer/gameServer";

import { HideAndSeekDataset } from "./hideAndSeekDataset";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { IdMap } from "~/lib/idMap";
import { User } from "@jetlag/shared-types";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

	public [sDataset]: HideAndSeekDataset | undefined = undefined;

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: HideAndSeekPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(_player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		return this.players.items;
	}
}
