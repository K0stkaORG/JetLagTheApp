import { Datasets, db, eq } from "~/db";

import { DatasetSaveFormat } from "@jetlag/shared-types";
import { GameServer } from "./gameServer";
import z from "zod";

export abstract class Dataset {
	protected constructor(
		protected readonly server: GameServer,
		public readonly name: string,
		public readonly version: number,
	) {}

	protected static async loadFromDatabase<T extends DatasetSaveFormat>(
		server: GameServer,
	): Promise<{
		name: string;
		version: number;
		data: T;
	}> {
		const dataset = await db.query.Datasets.findFirst({
			columns: {
				data: true,
				version: true,
			},
			where: eq(Datasets.id, server.game.datasetId),
			with: {
				metadata: {
					columns: {
						name: true,
					},
				},
			},
		});

		if (!dataset)
			throw new Error(`Could not find dataset with id ${server.game.datasetId} for game ${server.fullName}.`);

		const validatedData = this.getSchema().safeParse(dataset.data);

		if (!validatedData.success)
			throw new Error(
				`Dataset with id ${server.game.datasetId} for game ${server.fullName} failed validation: ${validatedData.error.message}`,
			);

		return {
			name: dataset.metadata.name,
			version: dataset.version,
			data: validatedData.data as T,
		};
	}

	protected static getSchema(): z.ZodType {
		throw new Error(`Dataset.getSchema() is not implemented.`);
	}

	public static async load(server: GameServer): Promise<Dataset> {
		throw new Error(`Dataset.load() for server type ${server.game.type} is not implemented.`);
	}
}
