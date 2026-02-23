import { db, eq, GameSettings as GameSettingsTable } from "~/db";

import { GameSettingsSaveFormat, getGameSettingsSchema } from "@jetlag/shared-types";
import { GameServer } from "./gameServer";

export abstract class GameSettings {
	protected constructor(
		protected readonly server: GameServer,
		public readonly data: GameSettingsSaveFormat,
	) {}

	protected static async loadFromDatabase<T extends GameSettingsSaveFormat>(server: GameServer): Promise<T> {
		const gameSettings = await db.query.GameSettings.findFirst({
			columns: {
				data: true,
			},
			where: eq(GameSettingsTable.gameId, server.game.id),
		});

		if (!gameSettings)
			throw new Error(`Could not find gameSettings with id ${server.game.id} for game ${server.fullName}.`);

		const validatedData = getGameSettingsSchema(server.game.type).safeParse(gameSettings.data);

		if (!validatedData.success)
			throw new Error(
				`GameSettings with id ${server.game.id} for game ${server.fullName} failed validation: ${validatedData.error.message}`,
			);

		return validatedData.data as T;
	}

	public static async load(server: GameServer): Promise<GameSettings> {
		throw new Error(`gameSettings.load() for server type ${server.game.type} is not implemented.`);
	}
}
