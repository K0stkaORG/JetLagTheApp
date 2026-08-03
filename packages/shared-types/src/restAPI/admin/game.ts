import z from "zod";
import { DatasetMetadataIdSchema } from "../../models/dataset";
import { Game, GameIdSchema, GameTypeSchema, TimelinePhase } from "../../models/game";
import { GameSettingsSaveFormat, getGameSettingsSchema } from "../../models/shared/settings";
import { GameStateSaveFormat } from "../../models/shared/state";
import { User, UserIdSchema } from "../../models/user";

export type AdminGamesListResponse = {
	id: Game["id"];
	type: Game["type"];
	serverLoaded: boolean;
	dataset: {
		name: string;
		version: number;
	};
	timeline: {
		sync: Date;
		gameTime: number;
		phase: TimelinePhase;
	};
	players: {
		online: number;
		total: number;
	};
}[];

export const AdminRequestWithGameId = z.object({
	gameId: GameIdSchema,
});
export type AdminRequestWithGameId = z.infer<typeof AdminRequestWithGameId>;

export type AdminGameInfoResponse = Pick<
	AdminGamesListResponse[number],
	"id" | "type" | "serverLoaded" | "timeline" | "dataset"
> & {
	players: {
		userId: User["id"];
		nickname: User["nickname"];
		colors: User["colors"];
		isOnline: boolean;
	}[];
	settings: GameSettingsSaveFormat;
	state: GameStateSaveFormat;
};

export const AdminAddPlayerRequest = z.object({
	gameId: GameIdSchema,
	userId: UserIdSchema,
});
export type AdminAddPlayerRequest = z.infer<typeof AdminAddPlayerRequest>;

export const AdminCreateGameRequest = z
	.object({
		type: GameTypeSchema,
		metadataId: DatasetMetadataIdSchema,
		startAt: z.coerce
			.date()
			.transform((date) => new Date(date.setSeconds(0, 0)))
			.refine((date) => date > new Date(), "Start time must be in the future"),
		settings: z.record(z.string(), z.any()),
		playerUserIds: z.array(UserIdSchema),
	})
	.superRefine(({ type, settings }, ctx) => {
		const res = getGameSettingsSchema(type).safeParse(settings);
		if (!res.success)
			for (const issue of res.error.issues)
				ctx.addIssue({
					...issue,
					path: ["settings", ...issue.path],
				});
	});
export type AdminCreateGameRequest = z.infer<typeof AdminCreateGameRequest>;

export type AdminCreateGameResponse = {
	id: Game["id"];
};
