import { GameServer } from "../../gameServer/gameServer";
import { User } from "@jetlag/shared-types";

export class HideAndSeekServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addUserAccessHook(user: User): Promise<void> {}
}
