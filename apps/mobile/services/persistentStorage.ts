import { Coordinates, Polygon, Team } from "~/types/models";

import AsyncStorage from "@react-native-async-storage/async-storage";

export type GameData = {
    gameId: number;

    team: Team;
    isHidersLeader: boolean;

    timeBonusMultiplier: number;

    gameAreaPolygon: Polygon;
    startingPosition: Coordinates;

    centreBoundingBoxNE: Coordinates;
    centreBoundingBoxSW: Coordinates;

    zoomMin: number;
    zoomMax: number;
    zoomInitial: number;
};

type NullableGameData = {
    [K in keyof GameData]: GameData[K] | null;
};

const GameContextKeys = [
    "gameId",
    "team",
    "isHidersLeader",
    "timeBonusMultiplier",
    "gameAreaPolygon",
    "startingPosition",
    "centreBoundingBoxNE",
    "centreBoundingBoxSW",
    "zoomMin",
    "zoomMax",
    "zoomInitial",
] as const;

const get = async (key: string): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        throw new Error("Error retrieving from async storage: " + error);
    }
};

const batchGet = async (
    keys: string[] | readonly string[]
): Promise<Record<string, string | null>> => {
    try {
        return Object.fromEntries(await AsyncStorage.multiGet(keys));
    } catch (error) {
        throw new Error("Error retrieving batch from async storage: " + error);
    }
};

const set = async (key: string, value: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        throw new Error("Error saving to async storage: " + error);
    }
};

const batchSet = async (items: Record<string, string>): Promise<void> => {
    const entries = Object.entries(items);
    try {
        await AsyncStorage.multiSet(entries);
    } catch (error) {
        throw new Error("Error saving batch to async storage: " + error);
    }
};

const remove = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        throw new Error("Error removing from async storage: " + error);
    }
};

const removeAll = async (): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        throw new Error("Error removing all from async storage: " + error);
    }
};

const parseGameData = (contextData: Record<string, string | null>): NullableGameData => ({
    gameId: contextData.gameId ? parseInt(contextData.gameId, 10) : null,
    team: contextData.team as Team | null,
    isHidersLeader: contextData.isHidersLeader ? contextData.isHidersLeader === "true" : null,
    timeBonusMultiplier: contextData.timeBonusMultiplier
        ? parseFloat(contextData.timeBonusMultiplier)
        : null,
    gameAreaPolygon: contextData.gameAreaPolygon ? JSON.parse(contextData.gameAreaPolygon) : null,
    startingPosition: contextData.startingPosition
        ? JSON.parse(contextData.startingPosition)
        : null,
    centreBoundingBoxNE: contextData.centreBoundingBoxNE
        ? JSON.parse(contextData.centreBoundingBoxNE)
        : null,
    centreBoundingBoxSW: contextData.centreBoundingBoxSW
        ? JSON.parse(contextData.centreBoundingBoxSW)
        : null,
    zoomMin: contextData.zoomMin ? parseInt(contextData.zoomMin, 10) : null,
    zoomMax: contextData.zoomMax ? parseInt(contextData.zoomMax, 10) : null,
    zoomInitial: contextData.zoomInitial ? parseInt(contextData.zoomInitial, 10) : null,
});

const getGameContext = async (): Promise<NullableGameData> => {
    const contextData = await batchGet(GameContextKeys);
    return parseGameData(contextData);
};

const setGameContext = async (gameData: GameData): Promise<void> =>
    batchSet({
        gameId: gameData.gameId.toString(),
        team: gameData.team,
        isHidersLeader: gameData.isHidersLeader.toString(),
        timeBonusMultiplier: gameData.timeBonusMultiplier.toString(),
        gameAreaPolygon: JSON.stringify(gameData.gameAreaPolygon),
        startingPosition: JSON.stringify(gameData.startingPosition),
        centreBoundingBoxNE: JSON.stringify(gameData.centreBoundingBoxNE),
        centreBoundingBoxSW: JSON.stringify(gameData.centreBoundingBoxSW),
        zoomMin: gameData.zoomMin.toString(),
        zoomMax: gameData.zoomMax.toString(),
        zoomInitial: gameData.zoomInitial.toString(),
    });

const removeGameContext = async (): Promise<void> => AsyncStorage.multiRemove(GameContextKeys);

export const PersistentStorage = {
    get,
    batchGet,
    set,
    batchSet,
    remove,
    removeAll,
    getGameContext,
    setGameContext,
    removeGameContext,
};
