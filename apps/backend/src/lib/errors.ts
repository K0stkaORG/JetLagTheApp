import { User } from "@jetlag/shared-types";
import { GameServer } from "~/lib/gameServer/gameServer";

export class UserRequestError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class AuthenticationError extends UserRequestError {
	constructor(public readonly ip: string) {
		super("You are not authorized to perform this action.");
	}
}

export class ExtendedError extends Error {
	constructor(
		message: string,
		public readonly details: {
			error?: Error | unknown;
			userId?: User["id"];
			service?: "orchestrator" | "gameServer" | "restAPI" | "socket" | "other";
		} & (
			| {
					service: "gameServer";
					gameServer: GameServer | string | number;
					userId?: User["id"];
			  }
			| {
					service: "restAPI";
					path: string;
					userId?: User["id"];
			  }
			| {
					service: "socket";
					socketId: string;
					gameServer?: GameServer;
					userId?: User["id"];
					event?: string;
			  }
			| {
					service: "orchestrator";
					gameServer?: GameServer | string | number;
			  }
			| {
					service?: "other";
			  }
		),
	) {
		super(message);
	}

	public isolateAffectedGameServer(): number | false {
		if (!(this.details.error instanceof ExtendedError)) {
			if (this.details.service !== "gameServer") return false;

			return this.gameServerId;
		}

		if (this.details.service !== "gameServer") return this.details.error.isolateAffectedGameServer();

		const childAffected = this.details.error.isolateAffectedGameServer();

		if (!childAffected) return this.gameServerId;

		if (childAffected !== this.gameServerId) return false;

		return this.gameServerId;
	}

	private get gameServerId(): number | false {
		if (this.details.service !== "gameServer") return false;

		if (typeof this.details.gameServer === "number") return this.details.gameServer;
		if (typeof this.details.gameServer === "string") return parseInt(this.details.gameServer, 10);
		if (typeof this.details.gameServer === "object") return this.details.gameServer.game.id;

		return false;
	}

	public static extractUserRequestError(error: unknown) {
		if (!(error instanceof ExtendedError)) throw error;

		if (error.details.error) ExtendedError.extractUserRequestError(error.details.error);

		throw error;
	}
}
