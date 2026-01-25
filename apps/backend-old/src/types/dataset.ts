import { Card, Coordinates, Polygon, Question } from ".";

export type Dataset = {
	id: number;

	name: string;
	description: string;

	ownerId: number;

	gameAreaPolygon: Polygon;
	startingPosition: Coordinates;

	centreBoundingBoxNE: Coordinates;
	centreBoundingBoxSW: Coordinates;

	minZoom: number;
	maxZoom: number;
	startingZoom: number;

	hidingTime: number;
	timeBonusMultiplier: number;

	questions: Question["id"][];
	cards: {
		cardId: Card["id"];
		amount: number;
	}[];

	deprecated: boolean;
};
