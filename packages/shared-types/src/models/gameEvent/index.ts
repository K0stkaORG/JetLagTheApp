import { HideAndSeekGameEvent } from "./hideAndSeek";
import { RoundaboutGameEvent } from "./roundabout";

export * from "./hideAndSeek";
export * from "./roundabout";

export type GameEvent = RoundaboutGameEvent | HideAndSeekGameEvent;
