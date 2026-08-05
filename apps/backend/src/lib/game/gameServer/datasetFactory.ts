import { DatasetParsedFormat } from "@jetlag/shared-types";
import { Datasets, db, eq } from "~/db";
import { ExtendedError } from "~/lib/errors";
import { GameServer } from "./gameServer";

export const DatasetFactory = async (
	server: GameServer,
): Promise<{
	metadata: GameServer["datasetMetadata"];
	data: DatasetParsedFormat;
}> => {
	const dataset = await db.query.Datasets.findFirst({
		columns: {
			id: true,
			parsed: true,
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
		throw new ExtendedError(`Could not find dataset with id ${server.game.datasetId}`, {
			service: "gameServer",
			gameServer: server,
		});

	return {
		metadata: {
			datasetId: dataset.id,
			metadataId: dataset.metadata.id,
			name: dataset.metadata.name,
			version: dataset.version,
		},
		data: dataset.parsed as DatasetParsedFormat,
	};
};
