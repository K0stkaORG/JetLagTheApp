import { Card, Question, StaticGameData } from "./models";

export type JoinGameStaticDataPacket = Omit<StaticGameData, "gameId"> & {
    questions: Question["id"][];
    cards: Card["id"][];
};
