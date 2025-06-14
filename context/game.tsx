import { createContext, useContext, useEffect, useState } from "react";

import { PersistentStorage } from "~/services/persistentStorage";

type GameContextType = {
    joinGame: (gameId: number) => Promise<void>;
} & (
    | {
          gameId: null;
      }
    | {
          gameId: number;
          team: "seekers" | "hiders";
          state: "planned" | "todo";
          debugChangeTeam: (team: "seekers" | "hiders") => Promise<void>;
          leaveGame: () => Promise<void>;
      }
);

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    const [gameId, setGameId] = useState<number | null>(null);
    const [team, setTeam] = useState<"seekers" | "hiders">("seekers");
    const [state, setState] = useState<"planned" | "todo">("planned");

    useEffect(() => {
        const fetchGameData = async () => {
            const storedGameData = await PersistentStorage.batchGet(["gameId", "team", "state"]);

            if (storedGameData.gameId) setGameId(parseInt(storedGameData.gameId, 10));
            if (storedGameData.team) setTeam(storedGameData.team as any);
            if (storedGameData.state) setState(storedGameData.state as any);
        };

        fetchGameData();
    }, []);

    const joinGame = async (newGameId: number) => {
        setGameId(newGameId);

        await PersistentStorage.set("gameId", newGameId.toString());
    };

    const debugChangeTeam = async (newTeam: "seekers" | "hiders") => {
        setTeam(newTeam);
        await PersistentStorage.set("team", newTeam);
    };

    const leaveGame = async () => {
        setGameId(null);
        await PersistentStorage.remove("gameId");
    };

    return (
        <GameContext.Provider value={{ gameId, team, state, joinGame, debugChangeTeam, leaveGame }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = () => useContext(GameContext);
export const useGame = () =>
    useContext(GameContext) as Extract<GameContextType, { gameId: number }>;
