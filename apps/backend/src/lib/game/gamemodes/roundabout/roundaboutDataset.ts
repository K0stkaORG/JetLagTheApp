import { RoundaboutDatasetSaveFormat } from "@jetlag/shared-types";
import { Dataset } from "../../gameServer/dataset";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutDataset extends Dataset {
	declare public readonly data: RoundaboutDatasetSaveFormat;

	public static async load(server: RoundaboutServer): Promise<RoundaboutDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<RoundaboutDatasetSaveFormat>(server);

		const instance = new RoundaboutDataset(server, name, version, metadataId, data);

		return instance;
	}
}
