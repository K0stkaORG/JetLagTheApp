import { GameServerWorker } from "@/lib/gameServer/gameServerWorker";
import { getHidingZone } from "./getHidingZone";

export const hideAndSeekWorker = new GameServerWorker("hideAndSeek", {
	getHidingZone,
});
