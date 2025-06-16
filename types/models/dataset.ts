import { Card, Polygon, Question } from ".";

// Aka. Olomouc, Brno, ...
export type Dataset = {
	id: number;
	name: string;
	description: string;
	ownerId: number;
	gameAreaPolygon: Polygon;
	hidingTime: number;
	timeBonusMultiplier: number;
	questions: Question["id"][];
	cards: {
		cardId: Card["id"];
		amount: number;
	}[];
	deprecated: boolean;
};
