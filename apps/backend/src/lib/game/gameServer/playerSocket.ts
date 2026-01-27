import { Player } from "./player";

export function registerPlayerSocketEventListeners(this: Player): void {
	this.socket!.on("general:positionUpdate", ({ cords }) => this.updatePosition(cords));
}
