import { GameServer } from "./gameServer";
import { PlayerFactory } from "./playerFactory";
import { User } from "@jetlag/shared-types";

export async function addPlayer(this: GameServer, userId: User["id"]): Promise<void> {
	const factory = PlayerFactory(this);

	const player = await factory.getById(userId);

	this.players.set(player.user.id, player);

	this.io.in(this.roomId).emit("general.notification", {
		message: `Player ${player.user.nickname} has been added to the game.`,
	});

	await this.addPlayerHook(player);
}
