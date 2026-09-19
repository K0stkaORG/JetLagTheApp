import { MultiPolygon, Polygon, voronoi } from "../../geoJSON";
import { IdMap } from "../../utility";
import { HideAndSeekDatasetInputFormat } from "./dataset";
import { AskedQuestion, Question, QuestionId } from "./questions";

export const getQuestionsMap = (
	dataset: Pick<HideAndSeekDatasetInputFormat, "questions" | "gameArea">,
): IdMap<QuestionId, Question> => {
	const map = new IdMap<QuestionId, Question>();

	let questionId = 0;

	for (const radar of dataset.questions.radar)
		map.set(questionId++, {
			name: `${radar.radius}${radar.units} Radar`,
			description: `Check, whether the hiders are within ${radar.radius}${radar.units} radius around your current position.`,
			costCards: radar.costCards,
			type: "radar",
			radiusMeters: radar.radius * (radar.units === "km" ? 1000 : 1),
			answerTimeSeconds: dataset.questions.waitForVetoSeconds,
		});

	for (const thermometer of dataset.questions.thermometer)
		map.set(questionId++, {
			name: `${thermometer.minDistance}${thermometer.units} Thermometer`,
			description: `Check, whether the hiders are closer to your current position or another point located at least ${thermometer.minDistance}${thermometer.units} away.`,
			costCards: thermometer.costCards,
			type: "thermometer",
			minDistanceMeters: thermometer.minDistance * (thermometer.units === "km" ? 1000 : 1),
			answerTimeSeconds: dataset.questions.waitForVetoSeconds,
		});

	if (dataset.questions.matching.district)
		map.set(questionId++, {
			name: "Same district",
			description: "Check, whether the hiders are in the same district as you.",
			costCards: dataset.questions.matching.district.costCards,
			type: "matching-district",
			districts: dataset.questions.matching.districts.map((d) => d.polygon),
			answerTimeSeconds: dataset.questions.waitForVetoSeconds,
		});

	if (dataset.questions.matching.districtColor) {
		const colorBuckets = new Map<string, Polygon[]>();

		for (const district of dataset.questions.matching.districts) {
			if (!colorBuckets.has(district.color)) colorBuckets.set(district.color, []);

			colorBuckets.get(district.color)!.push(district.polygon);
		}

		const zones: Record<string, MultiPolygon> = {};

		for (const [color, polygons] of colorBuckets.entries())
			zones[color] = {
				type: "MultiPolygon",
				coordinates: polygons.map((p) => p.coordinates),
			};

		map.set(questionId++, {
			name: "Same district color",
			description: "Check, whether the hiders are in a district with the same color as your district.",
			costCards: dataset.questions.matching.districtColor.costCards,
			type: "matching-districtColor",
			zones,
			answerTimeSeconds: dataset.questions.waitForVetoSeconds,
		});
	}

	for (const matchingOther of dataset.questions.matching.closest)
		map.set(questionId++, {
			name: `Closest ${matchingOther.name}`,
			description: `Check, whether the hiders' closest ${matchingOther.name} is the same as yours closest ${matchingOther.name}.`,
			costCards: matchingOther.costCards,
			type: "matching-closest",
			voronoi: voronoi(matchingOther.points, dataset.gameArea.polygon),
			answerTimeSeconds: dataset.questions.waitForVetoSeconds,
		});

	for (const image of dataset.questions.image)
		map.set(questionId++, {
			name: image.name,
			description: image.description,
			costCards: image.costCards,
			type: "image",
			answerTimeSeconds: image.answerTimeSeconds,
		});

	return map;
};

export const getQuestionCostMultiplier = (questionId: QuestionId, askedQuestions: AskedQuestion[]): number =>
	// Cost of a given question increments every time it is asked
	1 + askedQuestions.filter((q) => q.id === questionId).length;
