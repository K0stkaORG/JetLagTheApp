import z from "zod";
import { vornoi } from "../../geoJSON";
import { MultiPolygon, Polygon } from "../../geoJSON/types";
import { IdMap } from "../../utility/idMap";
import { HideAndSeekDatasetSaveFormat } from "./dataset";

export const CostCards = z.object({
	draw: z.number().positive(),
	keep: z.number().positive(),
});
export type CostCards = z.infer<typeof CostCards>;

export type Question = {
	name: string;
	description: string;
	costCards: CostCards;
	type: "radar" | "thermometer" | "matching" | "image";
} & (
	| { type: "radar"; radiusMeters: number }
	| { type: "thermometer"; minDistanceMeters: number }
	| ({ type: "matching"; subtype: "district" | "districtColor" | "other" } & (
			| { subtype: "district" }
			| { subtype: "districtColor"; zones: Record<string, Polygon> }
			| { subtype: "other"; vornoi: MultiPolygon }
	  ))
	| { type: "image" }
);

export const getQuestionsMap = (
	dataset: Pick<HideAndSeekDatasetSaveFormat, "questions" | "gameArea">,
): IdMap<number, Question> => {
	const map = new IdMap<number, Question>();

	let questionId = 0;

	for (const radar of dataset.questions.radar)
		map.set(questionId++, {
			name: `${radar.radius}${radar.units} Radar`,
			description: `Check, whether the hiders are within ${radar.radius}${radar.units} radius around your current position.`,
			costCards: radar.costCards,
			type: "radar",
			radiusMeters: radar.radius * (radar.units === "km" ? 1000 : 1),
		});

	for (const thermometer of dataset.questions.thermometer)
		map.set(questionId++, {
			name: `${thermometer.minDistance}${thermometer.units} Thermometer`,
			description: `Check, whether the hiders are closer to your current position or another point located at least ${thermometer.minDistance}${thermometer.units} away.`,
			costCards: thermometer.costCards,
			type: "thermometer",
			minDistanceMeters: thermometer.minDistance * (thermometer.units === "km" ? 1000 : 1),
		});

	if (dataset.questions.matching.district) {
	}

	if (dataset.questions.matching.districtColor) {
	}

	for (const matchingOther of dataset.questions.matching.other)
		map.set(questionId++, {
			name: `Closest ${matchingOther.name}`,
			description: `Check, whether the hiders' closest ${matchingOther.name} is the same as yours closest ${matchingOther.name}.`,
			costCards: matchingOther.costCards,
			type: "matching",
			subtype: "other",
			vornoi: vornoi(matchingOther.points, dataset.gameArea.polygon),
		});

	return map;
};
