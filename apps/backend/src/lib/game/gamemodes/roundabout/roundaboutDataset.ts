import { Cords } from "@jetlag/shared-types";
import { RoundaboutDatasetSaveFormat } from "@jetlag/shared-types/src/models/datasets/roundabout";
import { Dataset } from "../../gameServer/dataset";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutDataset extends Dataset {
	declare protected data: RoundaboutDatasetSaveFormat;

	protected constructor(
		server: RoundaboutServer,
		name: string,
		version: number,
		metadataId: number,
		data: RoundaboutDatasetSaveFormat,
	) {
		super(server, name, version, metadataId, data);
	}

	public static async load(server: RoundaboutServer): Promise<RoundaboutDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<RoundaboutDatasetSaveFormat>(server);

		const instance = new RoundaboutDataset(server, name, version, metadataId, data);

		return instance;
	}

	public get startingPoint(): Cords {
		return this.data.startingPoint;
	}

	public get spawns(): Cords[] {
		return this.data.spawns;
	}
}
