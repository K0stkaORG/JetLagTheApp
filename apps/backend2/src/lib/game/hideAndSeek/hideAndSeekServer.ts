import { GameServer } from "../gameServer";

export class HideAndSeekServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async shutdownHook(): Promise<void> {}
}
