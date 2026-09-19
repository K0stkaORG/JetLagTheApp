import { HideAndSeekServer } from "../hideAndSeekServer";

export async function onQuestionTimeout(this: HideAndSeekServer, questionIndex: number) {
	const question = this.state.current.questions[questionIndex]!;

	// If the question has not been answered (or vetoed), handle the question timeout
	if (!question.answer) await this.questions.handleQuestionTimeout(questionIndex);
}
