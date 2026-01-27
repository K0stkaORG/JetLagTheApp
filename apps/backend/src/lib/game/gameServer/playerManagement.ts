import { GameServer } from "./gameServer";
import { PlayerFactory } from "./playerFactory";
import { User } from "@jetlag/shared-types";

export async function addUserAccess(this: GameServer, userId: User["id"]): Promise<void> {
	const factory = PlayerFactory(this);

	const player = await factory.getById(userId);

	this.players.set(player.user.id, player);

	await this.addUserAccessHook(player);
}
