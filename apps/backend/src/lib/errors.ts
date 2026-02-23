import { User } from "@jetlag/shared-types";
import { GameServer } from "./game/gameServer/gameServer";

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
}
export class GameServerCrash extends ExtendedError {}
