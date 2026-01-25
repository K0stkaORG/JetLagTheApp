import { GameServer } from "./gameServer";
import { JoinAdvertisement } from "@jetlag/shared-types";

export function getJoinAdvertisement(this: GameServer): JoinAdvertisement {
	return {
		id: this.game.id,
		type: this.game.type,
	};
}
