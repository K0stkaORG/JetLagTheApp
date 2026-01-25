import { GameServer } from "./gameServer";
import { User } from "@jetlag/shared-types";

export async function addUserAccess(this: GameServer, user: User): Promise<void> {
	this.players.set(user.id, user);

	await this.addUserAccessHook(user);
}
