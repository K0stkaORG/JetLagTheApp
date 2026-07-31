import { GameSettingsSaveFormat, getGameSettingsSchema } from "@jetlag/shared-types";
import z from "zod";
import { db, eq, GameSettings } from "~/db";
import { ExtendedError } from "~/lib/errors";
import { GameServer } from "./gameServer";

export const GameSettingsFactory = async (server: GameServer): Promise<GameSettingsSaveFormat> => {
	const gameSettings = await db.query.GameSettings.findFirst({
		columns: {
			data: true,
		},
		where: eq(GameSettings.gameId, server.game.id),
	});

	if (!gameSettings)
		throw new ExtendedError(`Could not find gameSettings`, {
			service: "gameServer",
			gameServer: server,
		});

	const validatedData = getGameSettingsSchema(server.game.type).safeParse(gameSettings.data);

	if (!validatedData.success)
		throw new ExtendedError(`GameSettings failed validation`, {
			service: "gameServer",
			gameServer: server,
			error: z.prettifyError(validatedData.error),
		});

	return validatedData.data;
};
