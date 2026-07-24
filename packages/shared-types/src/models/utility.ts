import { Game } from "./game";

export const formatGameType = (type: Game["type"]) =>
	type.charAt(0).toUpperCase() +
	type
		.slice(1)
		.split(/(?=[A-Z])/)
		.join(" ");
