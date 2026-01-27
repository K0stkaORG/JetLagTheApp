import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";
import type { IPlayerFactory } from "../../gameServer/playerFactory";
import { User } from "@jetlag/shared-types";

export class HideAndSeekPlayerFactory implements IPlayerFactory {
	constructor(private readonly server: HideAndSeekServer) {}

	public async getById(_userId: User["id"]): Promise<HideAndSeekPlayer> {
		throw new Error("Method not implemented.");
	}

	public async getAllForServer(): Promise<HideAndSeekPlayer[]> {
		// throw new Error("Method not implemented.");
		return [];
	}
}
