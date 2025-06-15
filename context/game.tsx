import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { PersistentStorage } from "~/services/persistentStorage";
import { useServer } from "~/services/server";
import { useTokenAsync } from "./auth";

type GameContextType = {
    joinGame: (gameId: number) => Promise<void>;
    reset: () => Promise<void>;
} & (
    | {
          gameId: null;
      }
    | (GameData & {
          pause: () => Promise<void>;
          resume: () => Promise<void>;
          leaveGame: () => Promise<void>;
      })
);

type GameData = {
    gameId: number;
    team: "seekers" | "hiders";
    isHidersLeader: boolean;
    state: "planned" | "hiding_phase" | "main_phase" | "paused" | "finished";
};

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    const [gameId, setGameId] = useState<number | null>(null);
    const [team, setTeam] = useState<"seekers" | "hiders">();
    const [isHidersLeader, setIsHidersLeader] = useState<boolean>();
    const [state, setState] = useState<
        "planned" | "hiding_phase" | "main_phase" | "paused" | "finished"
    >();

    useEffect(() => {
        const fetchGameData = async () => {
            const storedGameData = await PersistentStorage.batchGet([
                "gameId",
                "team",
                "isHidersLeader",
                "state",
            ]);

            if (storedGameData.gameId) setGameId(parseInt(storedGameData.gameId, 10));
            if (storedGameData.team) setTeam(storedGameData.team as any);
            if (storedGameData.isHidersLeader)
                setIsHidersLeader(storedGameData.isHidersLeader === "true");
            if (storedGameData.state) setState(storedGameData.state as any);
        };

        fetchGameData();
    }, []);

    const joinGame = useCallback(async (newGameId: number) => {
        const response = await useServer<{ team: "hiders" | "seekers"; isHidersLeader: boolean }>(
            `/games/${newGameId}/join`,
            {
                token: await useTokenAsync(),
            }
        );

        if (!response.success) return response.consumeError();

        setGameId(newGameId);
        setTeam(response.data.team);

        setState("planned");

        await PersistentStorage.batchSet({
            gameId: newGameId.toString(),
            team: response.data.team,
            isHidersLeader: response.data.isHidersLeader.toString(),
            state: "planned",
        });
    }, []);

    const reset = useCallback(async () => {
        setGameId(null);
        setTeam(undefined);
        setState(undefined);

        await PersistentStorage.removeAll();
    }, []);

    const pause = useCallback(async () => {
        // if (state !== "main_phase") return; //TODO: Implement

        const response = await useServer<{ state: "paused" }>(`/games/${gameId}/pause`, {
            token: await useTokenAsync(),
        });

        if (!response.success) return response.consumeError();

        setState(response.data.state);

        await PersistentStorage.set("state", response.data.state);
    }, [gameId]);

    const resume = useCallback(async () => {
        // if (state !== "paused") return; //TODO: Implement

        const response = await useServer<{ state: "main_phase" }>(`/games/${gameId}/resume`, {
            token: await useTokenAsync(),
        });

        if (!response.success) return response.consumeError();

        setState(response.data.state);

        await PersistentStorage.set("state", response.data.state);
    }, [gameId]);

    return (
        <GameContext.Provider
            value={{
                gameId,
                team: team!,
                isHidersLeader: isHidersLeader!,
                state: state!,
                joinGame,
                leaveGame: reset,
                pause,
                resume,
                reset,
            }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = () => useContext(GameContext);
export const useGame = () =>
    useContext(GameContext) as Extract<GameContextType, { gameId: number }>;
export const useGameData = (): GameData => {
    const gameData = useGame();

    return {
        gameId: gameData.gameId,
        team: gameData.team,
        isHidersLeader: gameData.isHidersLeader,
        state: gameData.state,
    };
};
