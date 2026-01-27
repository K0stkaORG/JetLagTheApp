import type { IPlayerFactory } from "../../gameServer/playerFactory";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { RoundaboutServer } from "./roundaboutServer";
import { User } from "@jetlag/shared-types";

export class RoundaboutPlayerFactory implements IPlayerFactory {
	constructor(private readonly server: RoundaboutServer) {}

	public async getById(_userId: User["id"]): Promise<RoundaboutPlayer> {
		throw new Error("Method not implemented.");
	}

	public async getAllForServer(): Promise<RoundaboutPlayer[]> {
		return [];
		// throw new Error("Method not implemented.");
	}
}
