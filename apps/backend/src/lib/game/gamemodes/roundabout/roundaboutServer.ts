import { GameServer } from "../../gameServer/gameServer";
import { IdMap } from "~/lib/idMap";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { User } from "@jetlag/shared-types";

export class RoundaboutServer extends GameServer {
	public readonly players: IdMap<User["id"], RoundaboutPlayer> = new IdMap();

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: RoundaboutPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(player: RoundaboutPlayer): RoundaboutPlayer[] {
		return this.players.filter((p) => p.user.id !== player.user.id);
	}
}
