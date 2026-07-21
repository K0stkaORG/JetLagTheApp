import { GameTime, Point, User } from "@jetlag/shared-types";
import { GameServer } from "../../gameServer/gameServer";
import { Player } from "../../gameServer/player";

export class HideAndSeekPlayer extends Player {
	public constructor(
		server: GameServer,
		user: User,
		initialCords: Point,
		lastCordsUpdate: GameTime,
		public readonly team: "hiders" | "seekers",
	) {
		super(server, user, initialCords, lastCordsUpdate);
	}

	protected registerSocketEventListenersHook(): void {}
}
