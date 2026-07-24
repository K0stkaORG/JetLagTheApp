import {
	Card,
	circlesAroundPoints,
	clipMultiPolygon,
	getCardsMap,
	getQuestionsMap,
	HideAndSeekDatasetSaveFormat,
	IdMap,
	MultiPolygon,
	Question,
} from "@jetlag/shared-types";
import { Dataset } from "../../gameServer/dataset";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekDataset extends Dataset {
	declare public readonly data: HideAndSeekDatasetSaveFormat;
	public readonly cards: IdMap<number, Card>;
	public readonly questions: IdMap<number, Question>;
	public readonly gameArea: MultiPolygon;

	protected constructor(
		server: HideAndSeekServer,
		name: string,
		version: number,
		metadataId: number,
		data: HideAndSeekDatasetSaveFormat,
	) {
		super(server, name, version, metadataId, data);

		this.cards = getCardsMap(data);
		this.questions = getQuestionsMap(data);

		this.gameArea = clipMultiPolygon(
			circlesAroundPoints(data.gameArea.hidingSpots, data.hidingZoneRadiusMeters),
			data.gameArea.polygon,
		);
	}

	public static async load(server: HideAndSeekServer): Promise<HideAndSeekDataset> {
		const { name, version, metadataId, data } = await this.loadFromDatabase<HideAndSeekDatasetSaveFormat>(server);

		const instance = new HideAndSeekDataset(server, name, version, metadataId, data);

		return instance;
	}
}
