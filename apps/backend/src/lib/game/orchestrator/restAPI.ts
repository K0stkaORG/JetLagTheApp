import { LobbyInfo, User } from "@jetlag/shared-types";

import { Orchestrator } from "./orchestrator";

export function getLobbyForUser(this: Orchestrator, userId: User["id"]): LobbyInfo[] {
	return this.servers.filter((server) => server.players.has(userId)).map((server) => server.getLobbyInfo());
}
