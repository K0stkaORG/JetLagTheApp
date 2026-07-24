import { HideAndSeekGameEvent } from "../hideAndSeek/events";
import { RoundaboutGameEvent } from "../roundabout/events";

export * from "../hideAndSeek/events";
export * from "../roundabout/events";

export type GameEvent = RoundaboutGameEvent | HideAndSeekGameEvent;
