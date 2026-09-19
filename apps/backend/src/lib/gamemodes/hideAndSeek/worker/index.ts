import { GameServerWorker } from "@/lib/gameServer/gameServerWorker";
import { getHidingZone } from "./getHidingZone";
import { updateHidingZone } from "./updateHidingZone";

export const hideAndSeekWorker = new GameServerWorker("hideAndSeek", {
	getHidingZone,
	updateHidingZone,
});
