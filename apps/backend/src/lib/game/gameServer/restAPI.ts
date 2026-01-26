import { GameServer } from "./gameServer";
import { JoinAdvertisement } from "@jetlag/shared-types";

export function getJoinAdvertisement(this: GameServer): JoinAdvertisement {
	const playersArray = Array.from(this.players.values());

	return {
		id: this.game.id,
		type: this.game.type,
		gameTime: this.timeline.gameTime,
		phase: this.timeline.phase,
		players: {
			online: playersArray.filter((p) => p.isOnline).length,
			total: playersArray.length,
		},
	};
}
