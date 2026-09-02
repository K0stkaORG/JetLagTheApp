import { BaseClientToServerEvents, BaseServerToClientEvents } from "../../socket";
import { TypedPatch } from "../../utility";
import { GameType } from "../game";
import { HideAndSeekDatasetInputFormat, HideandSeekDatasetParsedFormat } from "../hideAndSeek/dataset";
import { HideAndSeekGameEvent } from "../hideAndSeek/events";
import { HideAndSeekGameSettingsSaveFormat } from "../hideAndSeek/settings";
import { HideAndSeekClientToServerEvents, HideAndSeekServerToClientEvents } from "../hideAndSeek/socket";
import { HideAndSeekGameStateSaveFormat } from "../hideAndSeek/state";
import { RoundaboutDatasetInputFormat, RoundaboutDatasetParsedFormat } from "../roundabout/dataset";
import { RoundaboutGameEvent } from "../roundabout/events";
import { RoundaboutGameSettingsSaveFormat } from "../roundabout/settings";
import { RoundaboutClientToServerEvents, RoundaboutServerToClientEvents } from "../roundabout/socket";
import { RoundaboutGameStateSaveFormat } from "../roundabout/state";
import { BaseGameEvent } from "./events";

type DatasetInputFormat<T extends GameType = GameType> = {
	hideAndSeek: HideAndSeekDatasetInputFormat;
	roundabout: RoundaboutDatasetInputFormat;
}[T];

type DatasetParsedFormat<T extends GameType = GameType> = {
	hideAndSeek: HideandSeekDatasetParsedFormat;
	roundabout: RoundaboutDatasetParsedFormat;
}[T];

type GameEvent<T extends GameType = GameType> =
	| BaseGameEvent
	| {
			hideAndSeek: HideAndSeekGameEvent;
			roundabout: RoundaboutGameEvent;
	  }[T];

type GameSettingsSaveFormat<T extends GameType = GameType> = {
	hideAndSeek: HideAndSeekGameSettingsSaveFormat;
	roundabout: RoundaboutGameSettingsSaveFormat;
}[T];

type GameStateSaveFormat<T extends GameType = GameType> = {
	hideAndSeek: HideAndSeekGameStateSaveFormat;
	roundabout: RoundaboutGameStateSaveFormat;
}[T];

type ClientToServerEvents<T extends GameType = GameType> = BaseClientToServerEvents &
	{
		hideAndSeek: HideAndSeekClientToServerEvents;
		roundabout: RoundaboutClientToServerEvents;
	}[T];

type ServerToClientEvents<T extends GameType = GameType> = BaseServerToClientEvents &
	{
		hideAndSeek: HideAndSeekServerToClientEvents;
		roundabout: RoundaboutServerToClientEvents;
	}[T];

export type Gamemode<T extends GameType> = {
	dataset: {
		input: DatasetInputFormat<T>;
		parsed: DatasetParsedFormat<T>;
	};

	event: GameEvent<T>;

	settings: GameSettingsSaveFormat<T>;

	state: GameStateSaveFormat<T>;
	patch: TypedPatch<GameStateSaveFormat<T>>;

	socket: {
		clientToServer: ClientToServerEvents<T>;
		serverToClient: ServerToClientEvents<T>;
	};
};

export type Gamemodes = Gamemode<GameType>;
