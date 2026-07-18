import { Point } from "@jetlag/shared-types";
import { RoundaboutDatasetSaveFormat } from "@jetlag/shared-types/src/models/datasets/roundabout";
import { Dataset } from "../../gameServer/dataset";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutDataset extends Dataset {
	declare public readonly data: RoundaboutDatasetSaveFormat;

	public static async load(server: RoundaboutServer): Promise<RoundaboutDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<RoundaboutDatasetSaveFormat>(server);

		const instance = new RoundaboutDataset(server, name, version, metadataId, data);

		return instance;
	}

	public get startingPoint(): Point {
		return this.data.startingPoint;
	}

	public get spawns(): Point[] {
		return this.data.spawns;
	}
}
