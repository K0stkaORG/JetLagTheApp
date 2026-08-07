import { isPointValid, Point, sphericalMean } from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { HideAndSeekServer } from "./hideAndSeekServer";

export const getHiderTeamPosition = (server: HideAndSeekServer): [Point, null] | [null, ExtendedError] => {
	const hiders = server.players.filter((p) => p.team === "hiders");

	if (hiders.length === 0)
		return [
			null,
			new ExtendedError("The hider team is empty", {
				service: "gameServer",
				gameServer: server,
			}),
		];

	const hiderPositions = hiders.map((p) => p.cords).filter((c) => isPointValid(c.cords));

	if (hiderPositions.length === 0)
		return [
			null,
			new ExtendedError("No valid hider positions", {
				service: "gameServer",
				gameServer: server,
			}),
		];

	let upToDateHiderPositions = hiderPositions.filter((c) => !c.stale);

	if (upToDateHiderPositions.length === 0) {
		logger.warn(
			new ExtendedError("Using stale hider positions for calculations", {
				service: "gameServer",
				gameServer: server,
			}),
		);

		upToDateHiderPositions = hiderPositions;
	}

	return [sphericalMean(upToDateHiderPositions.map((c) => c.cords)), null];
};
