export type HideAndSeekClientToServerEvents = {
	"hideAndSeek.question.ask": (data: { questionId?: number }) => void;
	"hideAndSeek.question.answer": (data: { questionId?: number; answer: string }) => void;
};

export type HideAndSeekServerToClientEvents = {};
