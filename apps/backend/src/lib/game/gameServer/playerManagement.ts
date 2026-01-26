import { GameServer } from "./gameServer";
import { Player } from "./player";
import { User } from "@jetlag/shared-types";

export async function addUserAccess(this: GameServer, user: User): Promise<void> {
	const player = await Player.load(this, user);

	this.players.set(player.user.id, player);

	await this.addUserAccessHook(user);
}
