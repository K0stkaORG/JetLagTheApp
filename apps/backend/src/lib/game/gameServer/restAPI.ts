import { GameServer } from "./gameServer";
import { JoinAdvertisement } from "@jetlag/shared-types";

export function getJoinAdvertisement(this: GameServer): JoinAdvertisement {
	return {
		id: this.game.id,
		type: this.game.type,
		gameTime: this.timeline.gameTime,
		phase: this.timeline.phase,
		players: {
			online: this.players.filter((p) => p.isOnline).length,
			total: this.players.count,
		},
	};
}
