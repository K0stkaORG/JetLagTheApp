import { HideAndSeekDatasetSaveFormat } from "@jetlag/shared-types";
import { Dataset } from "../../gameServer/dataset";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekDataset extends Dataset {
	declare protected readonly data: HideAndSeekDatasetSaveFormat;

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<HideAndSeekDatasetSaveFormat>(server);

		const instance = new HideAndSeekDataset(server, name, version, metadataId, data);

		return instance;
	}

	public get hideTimeSeconds() {
		return this.data.hideTimeSeconds;
	}

	public get hidingSpots() {
		return this.data.gameArea.hidingSpots;
	}
}
