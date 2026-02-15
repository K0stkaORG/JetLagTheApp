import { DatasetSaveFormat, getDatasetSchema } from "@jetlag/shared-types";
import { Datasets, db, eq } from "~/db";

import { GameServer } from "./gameServer";

export abstract class Dataset {
	protected constructor(
		protected readonly server: GameServer,
		public readonly name: string,
		public readonly version: number,
		public readonly metadataId: number,
		public readonly data: DatasetSaveFormat,
	) {}

	protected static async loadFromDatabase<T extends DatasetSaveFormat>(
		server: GameServer,
	): Promise<{
		name: string;
		version: number;
		metadataId: number;
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
						id: true,
						name: true,
					},
				},
			},
		});

		if (!dataset)
			throw new Error(`Could not find dataset with id ${server.game.datasetId} for game ${server.fullName}.`);

		const validatedData = getDatasetSchema(server.game.type).safeParse(dataset.data);

		if (!validatedData.success)
			throw new Error(
				`Dataset with id ${server.game.datasetId} for game ${server.fullName} failed validation: ${validatedData.error.message}`,
			);

		return {
			name: dataset.metadata.name,
			version: dataset.version,
			metadataId: dataset.metadata.id,
			data: validatedData.data as T,
		};
	}

	public static async load(server: GameServer): Promise<Dataset> {
		throw new Error(`Dataset.load() for server type ${server.game.type} is not implemented.`);
	}
}
