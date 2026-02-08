import { GameServer, sDataset } from "../../gameServer/gameServer";

import { IdMap } from "~/lib/idMap";
import { RoundaboutDataset } from "./roundaboutDataset";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { User } from "@jetlag/shared-types";

export class RoundaboutServer extends GameServer {
	public readonly players: IdMap<User["id"], RoundaboutPlayer> = new IdMap();

	public [sDataset]: RoundaboutDataset | undefined = undefined;

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: RoundaboutPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(_player: RoundaboutPlayer): RoundaboutPlayer[] {
		return this.players.items;
	}
}
