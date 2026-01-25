import { Coordinates, Polygon } from "~/types";
import { Datasets, db } from "~/db";
import { getBoundingBox, lerp } from "./utility";

const DEFAULT_MAX_ZOOM = 18.9;

type Props = {
	ownerId: number;
	name: string;
	description: string;
	gameAreaPolygon: Polygon;
	hidingTime: number;
	timeBonusMultiplier: number;
	cards: {
		cardId: number;
		amount: number;
	}[];
	questions: number[];
	startingPosition: Coordinates;
	maxZoom?: number;
};

export const createDataset = async ({
	ownerId,
	name,
	description,
	gameAreaPolygon,
	hidingTime,
	timeBonusMultiplier,
	cards,
	questions,
	startingPosition,
	maxZoom = DEFAULT_MAX_ZOOM,
}: Props) => {
	const boundingBox = getBoundingBox(gameAreaPolygon);

	const minZoom = 10; // TODO: Calculate based on boundingBox

	const startingZoom = lerp(minZoom, maxZoom, 0.8);

	return await db
		.insert(Datasets)
		.values([
			{
				ownerId,
				name,
				description,
				gameAreaPolygon,
				hidingTime,
				timeBonusMultiplier,
				cards,
				questions,
				minZoom,
				maxZoom,
				startingPosition,
				centreBoundingBoxNE: [boundingBox.e, boundingBox.n],
				centreBoundingBoxSW: [boundingBox.w, boundingBox.s],
				startingZoom,
			},
		])
		.returning()
		.then((res) => res[0].id);
};
