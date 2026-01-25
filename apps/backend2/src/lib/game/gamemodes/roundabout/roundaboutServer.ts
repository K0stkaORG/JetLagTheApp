import { GameServer } from "../../gameServer/gameServer";

export class RoundaboutServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}
}
