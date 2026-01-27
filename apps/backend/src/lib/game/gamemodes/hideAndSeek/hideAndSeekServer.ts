import { GameServer } from "../../gameServer/gameServer";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";

export class HideAndSeekServer extends GameServer {
	public readonly players: Map<number, HideAndSeekPlayer> = new Map();

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addUserAccessHook(_player: HideAndSeekPlayer): Promise<void> {}
}
