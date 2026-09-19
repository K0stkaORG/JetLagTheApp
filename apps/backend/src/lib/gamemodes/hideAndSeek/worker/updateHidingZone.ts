import {
	AnsweredQuestion,
	assertAnsweredQuestionType,
	assertNever,
	circle,
	keepHalfPlaneWithPoint,
	MultiPolygon,
	Question,
	splitOnBisector,
	subtract,
	union,
} from "@jetlag/shared-types";

export type UpdateHidingZoneInput = {
	question: AnsweredQuestion;
	questionDetails: Question;
	hidingZone: MultiPolygon;
	allPossibleHidingSpots: MultiPolygon;
};

export function updateHidingZone({
	question,
	questionDetails,
	hidingZone,
	allPossibleHidingSpots,
}: UpdateHidingZoneInput): {
	hidingZone: MultiPolygon;
	allPossibleHidingSpots: MultiPolygon;
} {
	const questionType = questionDetails.type;

	let updatedHidingZone = hidingZone;
	let updatedAllPossibleHidingSpots = allPossibleHidingSpots;

	switch (questionType) {
		case "radar": {
			assertAnsweredQuestionType(question, questionType);

			const circlePolygon = circle(question.center, questionDetails.radiusMeters);

			if (question.answer.result === "closer") {
				updatedHidingZone = union(hidingZone, circlePolygon);
				updatedAllPossibleHidingSpots = union(allPossibleHidingSpots, circlePolygon);
			} else {
				updatedHidingZone = subtract(hidingZone, circlePolygon);
				updatedAllPossibleHidingSpots = subtract(allPossibleHidingSpots, circlePolygon);
			}

			break;
		}

		case "thermometer": {
			assertAnsweredQuestionType(question, questionType);

			const split = splitOnBisector(allPossibleHidingSpots, question.start, question.end);
			const closerPoint = question.answer.result === "colder" ? "first" : "second";

			updatedHidingZone = keepHalfPlaneWithPoint(hidingZone, split, closerPoint);
			updatedAllPossibleHidingSpots = keepHalfPlaneWithPoint(allPossibleHidingSpots, split, closerPoint);

			break;
		}

		case "matching-district": {
			assertAnsweredQuestionType(question, questionType);

			const district = questionDetails.districts[question.districtIndex];

			if (question.answer.result === "same") {
				updatedHidingZone = union(hidingZone, district);
				updatedAllPossibleHidingSpots = union(allPossibleHidingSpots, district);
			} else {
				updatedHidingZone = subtract(hidingZone, district);
				updatedAllPossibleHidingSpots = subtract(allPossibleHidingSpots, district);
			}

			break;
		}

		case "matching-districtColor": {
			assertAnsweredQuestionType(question, questionType);

			const zone = questionDetails.zones[question.districtColor];

			if (question.answer.result === "same") {
				updatedHidingZone = union(hidingZone, zone);
				updatedAllPossibleHidingSpots = union(allPossibleHidingSpots, zone);
			} else {
				updatedHidingZone = subtract(hidingZone, zone);
				updatedAllPossibleHidingSpots = subtract(allPossibleHidingSpots, zone);
			}

			break;
		}

		case "matching-closest": {
			assertAnsweredQuestionType(question, questionType);

			const cell = questionDetails.voronoi[question.closestPoiIndex].zone;

			if (question.answer.result === "same") {
				updatedHidingZone = union(hidingZone, cell);
				updatedAllPossibleHidingSpots = union(allPossibleHidingSpots, cell);
			} else {
				updatedHidingZone = subtract(hidingZone, cell);
				updatedAllPossibleHidingSpots = subtract(allPossibleHidingSpots, cell);
			}

			break;
		}

		case "image":
			break;

		default:
			assertNever(questionType);
	}

	return { hidingZone: updatedHidingZone, allPossibleHidingSpots: updatedAllPossibleHidingSpots };
}
