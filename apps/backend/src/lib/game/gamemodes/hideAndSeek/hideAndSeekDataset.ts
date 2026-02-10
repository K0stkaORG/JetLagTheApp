import { Dataset } from "../../gameServer/dataset";
import { HideAndSeekDatasetSaveFormat } from "@jetlag/shared-types/src/models/datasets/hideAndSeek";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekDataset extends Dataset {
	protected constructor(server: HideAndSeekServer, name: string, version: number) {
		super(server, name, version);
	}

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekDataset> {
		const { name, version } = await this.loadFromDatabase<HideAndSeekDatasetSaveFormat>(server);

		const instance = new HideAndSeekDataset(server, name, version);

		return instance;
	}
}
