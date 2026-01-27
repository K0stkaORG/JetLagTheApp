import { GameServer } from "../../gameServer/gameServer";
import { User } from "@jetlag/shared-types";

export class RoundaboutServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addUserAccessHook(_user: User): Promise<void> {}
}
