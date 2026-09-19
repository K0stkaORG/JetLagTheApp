import {
	AnsweredQuestion,
	assertAnsweredQuestionType,
	assertNever,
	assertQuestionType,
	distanceMeters,
	getQuestionAnswerSchema,
	getQuestionCostMultiplier,
	getQuestionParamsSchema,
	pluralize,
	pointInPolygon,
	QuestionAnswer,
	QuestionId,
	QuestionParams,
} from "@jetlag/shared-types";
import { HideAndSeekServer } from "../hideAndSeekServer";
import type { UpdateHidingZoneInput } from "../worker/updateHidingZone";

export class QuestionsHandler {
	public constructor(private readonly server: HideAndSeekServer) {}

	public async ask(questionId: QuestionId, questionParams: QuestionParams): Promise<[true, null] | [false, string]> {
		const question = this.server.dataset.questions.get(questionId);
		if (!question) return [false, "Question not found"];

		const questionParamsSchema = getQuestionParamsSchema(question.type);
		const { data, success } = questionParamsSchema.safeParse(questionParams);
		if (!success) return [false, "Invalid question params"];

		const [canAskQuestions, errorMessage] = this.canAskQuestions();
		if (!canAskQuestions) return [false, errorMessage];

		const askedAt = this.server.timeline.gameTime;

		await this.server.state
			.set((state) => {
				state.questions.push({
					id: questionId,
					costMultiplier: getQuestionCostMultiplier(questionId, this.server.state.current.questions),
					askedAt,
					answer: null,
					...data,
				});
				state.unansweredQuestionIndex = state.questions.length - 1;
			})
			.commit();

		await this.server.eventManager.schedule(
			{
				type: "questionTimeout",
				questionIndex: this.server.state.current.unansweredQuestionIndex!,
			},
			askedAt + question.answerTimeSeconds * 1000,
		);

		return [true, null];
	}

	public async answer(answer: QuestionAnswer): Promise<[true, null] | [false, string]> {
		if (!this.server.timeline.gameLogicAllowed) return [false, "You can't answer when the game is not running"];

		if (this.server.state.current.unansweredQuestionIndex === null)
			return [false, "There is no unanswered question to answer"];

		const questionIndex = this.server.state.current.unansweredQuestionIndex;
		const question = this.server.state.current.questions[questionIndex];
		const questionType = this.server.dataset.questions.get(question.id)!.type;

		const answerSchema = getQuestionAnswerSchema(questionType);
		const { data, success } = answerSchema.safeParse(answer);

		if (!success) return [false, "Invalid answer"];

		this.server.state.set((state) => {
			state.questions[state.unansweredQuestionIndex!].answer = {
				at: this.server.timeline.gameTime,
				vetoed: false,
				...data,
			};
			state.unansweredQuestionIndex = null;
			state.questionGracePeriodUntil =
				this.server.timeline.gameTime + this.server.dataset.questionGracePeriodSeconds * 1000;
		});

		await this.updateHidingZone(questionIndex);

		return [true, null];
	}

	public veto(): [true, null] | [false, string] {
		if (!this.server.timeline.gameLogicAllowed) return [false, "You can't veto when the game is not running"];

		if (this.server.state.current.unansweredQuestionIndex === null)
			return [false, "There is no unanswered question to veto"];

		this.server.state.set((state) => {
			state.questions[state.unansweredQuestionIndex!].answer = {
				at: this.server.timeline.gameTime,
				vetoed: true,
			};
			state.unansweredQuestionIndex = null;
			state.questionGracePeriodUntil =
				this.server.timeline.gameTime + this.server.dataset.questionGracePeriodSeconds * 1000;
		});

		return [true, null];
	}

	public async handleQuestionTimeout(questionIndex: number) {
		const question = this.server.state.current.questions[questionIndex]!;
		const questionDetails = this.server.dataset.questions.get(question.id)!;
		const questionType = questionDetails.type;

		const hidingSpot = this.server.state.current.hidingSpot!;

		const q: AnsweredQuestion = { answer: {} } as AnsweredQuestion;

		switch (questionType) {
			case "radar": {
				assertQuestionType(question, questionType);
				assertAnsweredQuestionType(q, questionType);

				const distance = distanceMeters(hidingSpot, question.center);

				if (distance > questionDetails.radiusMeters) q.answer.result = "further";
				else q.answer.result = "closer";

				break;
			}

			case "thermometer": {
				assertQuestionType(question, questionType);
				assertAnsweredQuestionType(q, questionType);

				const distanceStart = distanceMeters(hidingSpot, question.start);
				const distanceEnd = distanceMeters(hidingSpot, question.end);

				if (distanceStart < distanceEnd) q.answer.result = "colder";
				else q.answer.result = "hotter";

				break;
			}

			case "matching-district": {
				assertQuestionType(question, questionType);
				assertAnsweredQuestionType(q, questionType);

				const district = questionDetails.districts[question.districtIndex];

				if (pointInPolygon(hidingSpot, district)) q.answer.result = "same";
				else q.answer.result = "different";

				break;
			}

			case "matching-districtColor": {
				assertQuestionType(question, questionType);
				assertAnsweredQuestionType(q, questionType);

				const zone = questionDetails.zones[question.districtColor];

				if (pointInPolygon(hidingSpot, zone)) q.answer.result = "same";
				else q.answer.result = "different";

				break;
			}

			case "matching-closest": {
				assertQuestionType(question, questionType);
				assertAnsweredQuestionType(q, questionType);

				const cell = questionDetails.voronoi[question.closestPoiIndex].zone;

				if (pointInPolygon(hidingSpot, cell)) q.answer.result = "same";
				else q.answer.result = "different";

				break;
			}

			case "image":
				this.server.io.emit("general.notification", {
					message: "Hiders failed to answer the image question in time, pausing the game",
				});

				await this.server.timeline.pauseSync();

				return;

			default:
				assertNever(questionType);
		}

		const now = this.server.timeline.gameTime;

		this.server.state.set((state) => {
			state.questions[questionIndex].answer = {
				at: now,
				vetoed: false,
				...q.answer,
			};
			state.unansweredQuestionIndex = null;
			state.questionGracePeriodUntil = now + this.server.dataset.questionGracePeriodSeconds * 1000;
		});

		await this.updateHidingZone(questionIndex);

		await this.server.state.commit();
	}

	private async updateHidingZone(questionIndex: number) {
		const question = this.server.state.current.questions[questionIndex]!;
		if (question.answer!.vetoed) return;

		const questionDetails = this.server.dataset.questions.get(question.id)!;
		if (questionDetails.type === "image") return;

		const { hidingZone, allPossibleHidingSpots } = await this.server.worker.run("updateHidingZone", {
			question,
			questionDetails,
			hidingZone: this.server.state.current.hidingZone!,
			allPossibleHidingSpots: this.server.state.current.allPossibleHidingSpots!,
		} as UpdateHidingZoneInput);

		this.server.state.set((state) => {
			state.hidingZone = hidingZone;
			state.allPossibleHidingSpots = allPossibleHidingSpots;
		});
	}

	private canAskQuestions(): [true, null] | [false, string] {
		if (!this.server.timeline.gameLogicAllowed)
			return [false, "You can't ask questions when the game is not running"];

		if (this.server.state.current.gamePhase === "hiding")
			return [false, "You can't ask questions during hiding phase"];

		if (this.server.state.current.unansweredQuestionIndex !== null)
			return [false, "You can't ask questions when there is an unanswered question"];

		{
			const msRemaining = this.server.state.current.questionGracePeriodUntil - this.server.timeline.gameTime;

			if (msRemaining > 0)
				return [
					false,
					`You can't ask questions for another ${Math.ceil(msRemaining / 1000)} ${pluralize(Math.ceil(msRemaining / 1000), "second", "seconds")}`,
				];
		}

		return [true, null];
	}
}
