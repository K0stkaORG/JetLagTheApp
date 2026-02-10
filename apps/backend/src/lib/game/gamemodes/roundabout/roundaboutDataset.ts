import { Dataset } from "../../gameServer/dataset";
import { RoundaboutDatasetSaveFormat } from "@jetlag/shared-types/src/models/datasets/roundabout";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutDataset extends Dataset {
	protected constructor(server: RoundaboutServer, name: string, version: number) {
		super(server, name, version);
	}

	public static async load(server: RoundaboutServer): Promise<RoundaboutDataset> {
		const { name, version } = await this.loadFromDatabase<RoundaboutDatasetSaveFormat>(server);

		const instance = new RoundaboutDataset(server, name, version);

		return instance;
	}
}
