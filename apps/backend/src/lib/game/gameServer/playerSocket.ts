import { Player } from "./player";

export function registerPlayerSocketEventListeners(this: Player): void {
	this.socket!.on("general.player.positionUpdate", ({ cords }) => this.updatePosition(cords));
}
