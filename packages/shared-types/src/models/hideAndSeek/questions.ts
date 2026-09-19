import z from "zod";

import { MultiPolygon, Point, Polygon, Voronoi } from "../../geoJSON";
import { assertNever } from "../../utility";
import { GameTime } from "../game";

// --- External Types ---

export type QuestionId = number;

export const CostCards = z.object({
	draw: z.number().int().positive(),
	keep: z.number().int().positive(),
});
export type CostCards = z.infer<typeof CostCards>;

export type Question = {
	name: string;
	description: string;
	costCards: CostCards;
	answerTimeSeconds: number;
} & (
	| { type: "radar"; radiusMeters: number }
	| { type: "thermometer"; minDistanceMeters: number }
	| { type: "matching-district"; districts: Polygon[] }
	| { type: "matching-districtColor"; zones: Record<string, MultiPolygon> }
	| { type: "matching-closest"; voronoi: Voronoi }
	| { type: "image" }
);

export type AskedQuestion<T extends Question["type"] = Question["type"]> = {
	id: QuestionId;
	costMultiplier: number;
	askedAt: GameTime;
	answer: WrappedAnswer;
} & {
	radar: { center: Point; answer: WrappedAnswer<RadarAnswer> };
	thermometer: { start: Point; end: Point; answer: WrappedAnswer<ThermometerAnswer> };
	"matching-district": {
		districtIndex: number;
		answer: WrappedAnswer<MatchingAnswer>;
	};
	"matching-districtColor": {
		districtColor: string;
		answer: WrappedAnswer<MatchingAnswer>;
	};
	"matching-closest": {
		closestPoiIndex: number;
		answer: WrappedAnswer<MatchingAnswer>;
	};
	image: {
		answer: WrappedAnswer<ImageAnswer>;
	};
}[T];

export type QuestionParams<T extends Question["type"] = Question["type"]> = Omit<
	AskedQuestion<T>,
	"id" | "costMultiplier" | "askedAt" | "answer"
>;

export type QuestionAnswer = RadarAnswer | ThermometerAnswer | MatchingAnswer | ImageAnswer;

/// --- Question params ---

const radarParams: z.ZodType<QuestionParams<"radar">> = z.object({
	center: Point,
});

const thermometerParams: z.ZodType<QuestionParams<"thermometer">> = z.object({
	start: Point,
	end: Point,
});

const matchingDistrictParams: z.ZodType<QuestionParams<"matching-district">> = z.object({
	districtIndex: z.number().int(),
});

const matchingDistrictColorParams: z.ZodType<QuestionParams<"matching-districtColor">> = z.object({
	districtColor: z.string(),
});

const matchingClosestParams: z.ZodType<QuestionParams<"matching-closest">> = z.object({
	closestPoiIndex: z.number().int(),
});

const imageParams: z.ZodType<QuestionParams<"image">> = z.object({});

/// --- Question answers ---

type WrappedAnswer<Details = unknown> =
	| {
			at: GameTime;
			vetoed: true;
	  }
	| ({
			at: GameTime;
			vetoed: false;
	  } & Details)
	| null;

type RadarAnswer = { result: "closer" | "further" };
const radarAnswer: z.ZodType<RadarAnswer> = z.object({
	result: z.enum(["closer", "further"]),
});

type ThermometerAnswer = { result: "hotter" | "colder" };
const thermometerAnswer: z.ZodType<ThermometerAnswer> = z.object({
	result: z.enum(["hotter", "colder"]),
});

type MatchingAnswer = { result: "same" | "different" };
const matchingAnswer: z.ZodType<MatchingAnswer> = z.object({
	result: z.enum(["same", "different"]),
});

type ImageAnswer = { imageUid: string };
const imageAnswer: z.ZodType<ImageAnswer> = z.object({
	imageUid: z.string(),
});

/// --- Schemas ---

const wrappedAnswer = <T>(detailsSchema: z.ZodType<T>): z.ZodType<{ answer: WrappedAnswer<T> }> =>
	z.object({
		answer: z
			.union([
				z.object({
					at: GameTime,
					vetoed: z.literal(true),
				}),
				z
					.object({
						at: GameTime,
						vetoed: z.literal(false),
					})
					.and(detailsSchema),
			])
			.nullable(),
	});

export const AskedQuestion: z.ZodType<AskedQuestion> = z
	.object({
		id: z.number().int(),
		costMultiplier: z.number().int(),
		askedAt: GameTime,
	})
	.and(
		z.union([
			radarParams.and(wrappedAnswer(radarAnswer)),
			thermometerParams.and(wrappedAnswer(thermometerAnswer)),
			matchingDistrictParams.and(wrappedAnswer(matchingAnswer)),
			matchingDistrictColorParams.and(wrappedAnswer(matchingAnswer)),
			matchingClosestParams.and(wrappedAnswer(matchingAnswer)),
			imageParams.and(wrappedAnswer(imageAnswer)),
		]),
	);

export const getQuestionParamsSchema = (type: Question["type"]): z.ZodType<QuestionParams> => {
	switch (type) {
		case "radar":
			return radarParams;

		case "thermometer":
			return thermometerParams;

		case "matching-district":
			return matchingDistrictParams;

		case "matching-districtColor":
			return matchingDistrictColorParams;

		case "matching-closest":
			return matchingClosestParams;

		case "image":
			return imageParams;

		default:
			return assertNever(type);
	}
};

export const getQuestionAnswerSchema = (type: Question["type"]): z.ZodType<QuestionAnswer> => {
	switch (type) {
		case "radar":
			return radarAnswer;

		case "thermometer":
			return thermometerAnswer;

		case "matching-district":
		case "matching-districtColor":
		case "matching-closest":
			return matchingAnswer;

		case "image":
			return imageAnswer;

		default:
			return assertNever(type);
	}
};

// --- Utility Types ---

export type AnsweredQuestion<T extends Question["type"] = Question["type"]> = T extends Question["type"]
	? Omit<AskedQuestion<T>, "id" | "costMultiplier" | "askedAt" | "answer"> & {
			answer: Omit<Extract<AskedQuestion<T>["answer"], { vetoed: false }>, "at" | "vetoed">;
		}
	: never;

export function assertQuestionType<T extends Question["type"]>(
	_question: AskedQuestion,
	_type: T,
): asserts _question is T extends Question["type"] ? AskedQuestion<T> : never {}

export function assertAnsweredQuestionType<T extends Question["type"]>(
	_question: AnsweredQuestion,
	_type: T,
): asserts _question is AnsweredQuestion<T> {}
