import { HideAndSeekDatasetSaveFormat } from "@jetlag/shared-types/src/models/datasets/hideAndSeek";
import { Dataset } from "../../gameServer/dataset";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekDataset extends Dataset {
	protected constructor(
		server: HideAndSeekServer,
		name: string,
		version: number,
		metadataId: number,
		data: HideAndSeekDatasetSaveFormat,
	) {
		super(server, name, version, metadataId, data);
	}

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<HideAndSeekDatasetSaveFormat>(server);

		const instance = new HideAndSeekDataset(server, name, version, metadataId, data);

		return instance;
	}
}
