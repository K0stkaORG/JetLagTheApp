import { Card, Coordinates, Dataset, Game, IdMap, Polygon, Question, User } from "~/types";
import { Cards, Questions, db } from "~/db";

import { MapById } from "../utility";
import { inArray } from "drizzle-orm";

export class StaticDataStore {
	private constructor(
		public readonly gameId: number,

		public readonly datasetId: Dataset["id"],

		public readonly datasetName: Dataset["name"],
		public readonly datasetDescription: Dataset["description"],

		public readonly gameAreaPolygon: Polygon,
		public readonly startingPosition: Coordinates,

		public readonly centreBoundingBoxNE: Coordinates,
		public readonly centreBoundingBoxSW: Coordinates,

		public readonly minZoom: number,
		public readonly maxZoom: number,
		public readonly startingZoom: number,

		public readonly hidingTime: number,
		public readonly timeBonusMultiplier: number,

		public readonly questions: IdMap<Question>,
		public readonly questionIds: Question["id"][],
		public readonly cards: IdMap<Card>,
		public readonly cardIds: Card["id"][],

		public readonly startsAt: Date,

		public readonly players: {
			hiders: User["id"][];
			seekers: User["id"][];
			hidersTeamLeader: User["id"];
		}
	) {}

	public static async load(game: Game & { dataset: Dataset }): Promise<StaticDataStore> {
		const questions = await db.query.Questions.findMany({
			where: inArray(Questions.id, game.dataset.questions),
		});

		const cards = await db.query.Cards.findMany({
			where: inArray(
				Cards.id,
				game.dataset.cards.map((card) => card.cardId)
			),
		});

		return new StaticDataStore(
			game.id,
			game.dataset.id,
			game.dataset.name,
			game.dataset.description,
			game.dataset.gameAreaPolygon,
			game.dataset.startingPosition,
			game.dataset.centreBoundingBoxNE,
			game.dataset.centreBoundingBoxSW,
			game.dataset.minZoom,
			game.dataset.maxZoom,
			game.dataset.startingZoom,
			game.dataset.hidingTime,
			game.dataset.timeBonusMultiplier,
			MapById(questions),
			questions.map((question) => question.id),
			MapById(cards),
			cards.map((card) => card.id),
			game.startsAt,
			{
				hiders: game.hiders,
				seekers: game.seekers,
				hidersTeamLeader: game.hidersTeamLeader,
			}
		);
	}

	public get debug() {
		return {
			datasetId: this.datasetId,
			gameAreaPolygon: this.gameAreaPolygon,
			startingPosition: this.startingPosition,
			centreBoundingBoxNE: this.centreBoundingBoxNE,
			centreBoundingBoxSW: this.centreBoundingBoxSW,
			minZoom: this.minZoom,
			maxZoom: this.maxZoom,
			startingZoom: this.startingZoom,
			hidingTime: this.hidingTime,
			timeBonusMultiplier: this.timeBonusMultiplier,
			questions: this.questions,
			cards: this.cards,
			startsAt: this.startsAt.toLocaleString(),
			players: this.players,
		};
	}
}
