import { GameServer } from "../../gameServer/gameServer";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { IdMap } from "~/lib/idMap";
import { User } from "@jetlag/shared-types";

export class HideAndSeekServer extends GameServer {
	public readonly players: IdMap<User["id"], HideAndSeekPlayer> = new IdMap();

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: HideAndSeekPlayer): Promise<void> {}

	public getPlayerPositionUpdateRecipients(player: HideAndSeekPlayer): HideAndSeekPlayer[] {
		return this.players.filter((p) => p.user.id !== player.user.id);
	}
}
