import { GameServer } from "../../gameServer/gameServer";

export class HideAndSeekServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}
}
