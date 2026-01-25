import { JoinAdvertisement, User } from "@jetlag/shared-types";

import { Orchestrator } from "./orchestrator";

export function getJoinAdvertisementsForUser(this: Orchestrator, userId: User["id"]): JoinAdvertisement[] {
	return this.gameServerIds
		.map((gameId) => this.gameServers.get(gameId)!)
		.filter((server) => server.players.has(userId))
		.map((server) => server.getJoinAdvertisement());
}
