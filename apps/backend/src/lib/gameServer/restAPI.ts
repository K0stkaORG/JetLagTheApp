import { LobbyInfo } from "@jetlag/shared-types";
import { GameServer } from "./gameServer";

export function getLobbyInfo(this: GameServer): LobbyInfo {
	return {
		id: this.game.id,
		datasetId: this.game.datasetId,
		type: this.game.type,
		gameTime: this.timeline.gameTime,
		phase: this.timeline.phase,
		players: {
			online: this.players.filter((p) => p.isOnline).length,
			total: this.players.count,
		},
	};
}
