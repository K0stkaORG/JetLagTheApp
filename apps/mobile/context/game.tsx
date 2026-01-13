import { Coordinates, Polygon, StaticGameData, Team } from "~/types/models";
import { DynamicGameData, useDynamicGameData } from "~/services/dynamicGameData/dynamicGameData";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { JoinGameStaticDataPacket } from "~/types/packets";
import { PersistentStorage } from "~/services/persistentStorage";
import Spinner from "~/components/ui/Spinner";
import { preloadStaticGameData } from "~/services/staticGameData";
import { useServer } from "~/services/server";
import { useTokenAsync } from "./auth";

type GameContextType = {
    joinGame: (gameId: number) => Promise<void>;
} & (
    | {
          gameId: null;
      }
    | ({
          reconnect: () => Promise<void>;
          leaveGame: () => Promise<void>;

          pause: () => Promise<void>;
          resume: () => Promise<void>;
      } & StaticGameData &
          DynamicGameData)
);

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isJoining, setIsJoining] = useState<boolean>(false);

    const [gameId, setGameId] = useState<number | null>(null);

    const [team, setTeam] = useState<Team | null>(null);
    const [isHidersLeader, setIsHidersLeader] = useState<boolean | null>(null);

    const [timeBonusMultiplier, setTimeBonusMultiplier] = useState<number | null>(null);

    const [gameAreaPolygon, setGameAreaPolygon] = useState<Polygon | null>(null);
    const [startingPosition, setStartingPosition] = useState<Coordinates | null>(null);

    const [centreBoundingBoxNE, setCentreBoundingBoxNE] = useState<Coordinates | null>(null);
    const [centreBoundingBoxSW, setCentreBoundingBoxSW] = useState<Coordinates | null>(null);

    const [zoomMin, setZoomMin] = useState<number | null>(null);
    const [zoomMax, setZoomMax] = useState<number | null>(null);
    const [zoomInitial, setZoomInitial] = useState<number | null>(null);

    const { dynamicData, functions, dynamicDataState } = useDynamicGameData(gameId, () =>
        leaveGame()
    );

    useEffect(() => {
        PersistentStorage.getGameContext().then((storedGameData) => {
            setIsLoading(false);

            setGameId(storedGameData.gameId);

            setTeam(storedGameData.team);
            setIsHidersLeader(storedGameData.isHidersLeader);

            setTimeBonusMultiplier(storedGameData.timeBonusMultiplier);

            setGameAreaPolygon(storedGameData.gameAreaPolygon);
            setStartingPosition(storedGameData.startingPosition);

            setCentreBoundingBoxNE(storedGameData.centreBoundingBoxNE);
            setCentreBoundingBoxSW(storedGameData.centreBoundingBoxSW);

            setZoomMin(storedGameData.zoomMin);
            setZoomMax(storedGameData.zoomMax);
            setZoomInitial(storedGameData.zoomInitial);
        });
    }, []);

    const joinGame = useCallback(
        async (newGameId: number) => {
            if (gameId !== null) await leaveGame();

            setIsJoining(true);

            const response = await useServer<JoinGameStaticDataPacket>(`/games/${newGameId}/join`, {
                token: await useTokenAsync(),
            });

            if (!response.success) {
                setIsJoining(false);
                return response.consumeError();
            }

            setGameId(newGameId);

            functions.reconnect();

            setTeam(response.data.team);
            setIsHidersLeader(response.data.isHidersLeader);

            setTimeBonusMultiplier(response.data.timeBonusMultiplier);

            setGameAreaPolygon(response.data.map.gameAreaPolygon);
            setStartingPosition(response.data.map.startingPosition);

            setCentreBoundingBoxNE(response.data.map.centreBoundingBox.ne);
            setCentreBoundingBoxSW(response.data.map.centreBoundingBox.sw);

            setZoomMin(response.data.map.zoom.min);
            setZoomMax(response.data.map.zoom.max);
            setZoomInitial(response.data.map.zoom.initial);

            await PersistentStorage.setGameContext({
                gameId: newGameId,

                team: response.data.team,
                isHidersLeader: response.data.isHidersLeader,

                timeBonusMultiplier: response.data.timeBonusMultiplier,

                gameAreaPolygon: response.data.map.gameAreaPolygon,
                startingPosition: response.data.map.startingPosition,

                centreBoundingBoxNE: response.data.map.centreBoundingBox.ne,
                centreBoundingBoxSW: response.data.map.centreBoundingBox.sw,

                zoomMin: response.data.map.zoom.min,
                zoomMax: response.data.map.zoom.max,
                zoomInitial: response.data.map.zoom.initial,
            });

            await Promise.allSettled([
                preloadStaticGameData.cards(response.data.cards),
                preloadStaticGameData.questions(response.data.questions),
            ]);

            setIsJoining(false);
        },
        [gameId, functions.reconnect]
    );

    const leaveGame = useCallback(async () => {
        setGameId(null);
        setTeam(null);
        setIsHidersLeader(null);

        await PersistentStorage.removeGameContext();
    }, []);

    if (isLoading) return <Spinner fullscreen />;

    if (isJoining || dynamicDataState.isConnecting)
        return <Spinner fullscreen text="Připojování do hry..." />;

    return (
        <GameContext.Provider
            value={{
                isOnline: dynamicDataState.isOnline,
                gameId,
                team: team!,
                isHidersLeader: isHidersLeader!,
                timeBonusMultiplier: timeBonusMultiplier!,
                map: {
                    gameAreaPolygon: gameAreaPolygon!,
                    startingPosition: startingPosition!,
                    centreBoundingBox: {
                        ne: centreBoundingBoxNE!,
                        sw: centreBoundingBoxSW!,
                    },
                    zoom: {
                        min: zoomMin!,
                        max: zoomMax!,
                        initial: zoomInitial!,
                    },
                },
                ...dynamicData,
                joinGame,
                leaveGame,
                pause: functions.pause,
                resume: functions.resume,
                reconnect: functions.reconnect,
            }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = () => useContext(GameContext);
export const useGame = () =>
    useContext(GameContext) as Extract<GameContextType, { gameId: number }>;
export const useGameData = (): StaticGameData & DynamicGameData => {
    const gameData = useGame();

    return {
        gameId: gameData.gameId,
        isOnline: gameData.isOnline,
        state: gameData.state,
        team: gameData.team,
        isHidersLeader: gameData.isHidersLeader,
        timeBonusMultiplier: gameData.timeBonusMultiplier,
        map: gameData.map,
    };
};
