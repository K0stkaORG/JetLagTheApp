import { Game } from "~/types/models/game";
import { toast } from "sonner-native";
import { useCallback } from "react";

type Props = {
    leaveGame: () => Promise<void>;
    resetState: () => void;

    connectionTimeout: React.RefObject<NodeJS.Timeout | null>;

    isOnline: boolean;
    setIsOnline: (value: boolean) => void;
    isConnecting: boolean;
    setIsConnecting: (value: boolean) => void;

    state: Game["state"] | null;
    setState: (value: Game["state"] | null) => void;
};

export const usePacketHandlers = ({
    leaveGame,
    resetState,
    connectionTimeout,
    isOnline,
    setIsOnline,
    isConnecting,
    setIsConnecting,
    state,
    setState,
}: Props) => {
    const joinPacketHandler = useCallback(async () => {
        clearTimeout(connectionTimeout.current!);
        connectionTimeout.current = null;

        console.log(`Successfully joined game.`);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsConnecting(false);
        setState(Date.now().toString() as Game["state"]);
    }, [setIsConnecting, setState]);

    const kickPacketHandler = useCallback(async () => {
        clearTimeout(connectionTimeout.current!);
        connectionTimeout.current = null;

        await leaveGame();

        toast.warning("Server pro danou hru není online.");

        setIsConnecting(false);
        resetState();
    }, [leaveGame, setIsConnecting]);

    return {
        joinPacketHandler,
        kickPacketHandler,
    };
};
