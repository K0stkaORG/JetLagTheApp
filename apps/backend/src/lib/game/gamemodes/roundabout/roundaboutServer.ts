import { IdMap } from "~/lib/idMap";
import { GameServer } from "../../gameServer/gameServer";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { User } from "@jetlag/shared-types";

export class RoundaboutServer extends GameServer {
	public readonly players: IdMap<User["id"], RoundaboutPlayer> = new IdMap();

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addUserAccessHook(_player: RoundaboutPlayer): Promise<void> {}
}
