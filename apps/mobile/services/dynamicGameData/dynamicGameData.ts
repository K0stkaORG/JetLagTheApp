import { useCallback, useEffect, useRef, useState } from "react";

import { Game } from "~/types/models";
import { socket } from "../socket";
import { toast } from "sonner-native";
import { usePacketHandlers } from "./packetHandlers";
import { useServer } from "../server";
import { useTokenAsync } from "~/context/auth";

const CONNECTION_TIMEOUT = 5000;

export type DynamicGameData = {
    isOnline: boolean;
    state: Game["state"];
};

export const useDynamicGameData = (gameId: number | null, leaveGame: () => Promise<void>) => {
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    const [state, setState] = useState<Game["state"] | null>(null);

    const resetState = useCallback(() => {
        setState(null);
    }, []);

    const { joinPacketHandler, kickPacketHandler } = usePacketHandlers({
        leaveGame,
        resetState,
        connectionTimeout,
        isOnline,
        setIsOnline,
        isConnecting,
        setIsConnecting,
        state,
        setState,
    });

    useEffect(() => {
        socket.on("connect", () => setIsOnline(true));
        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsOnline(false);
        });

        socket.on("joined", joinPacketHandler);
        socket.on("kick", kickPacketHandler);

        return () => {
            socket.off("connect");
            socket.off("disconnect");

            socket.off("joined");
            socket.off("kick");
        };
    }, []);

    useEffect(() => {
        console.log(`useDynamicGameData: gameId changed to ${gameId}`);

        if (!gameId) return;

        connectToGame();

        return () => {
            if (!gameId) return;

            console.log(`useDynamicGameData: disconnecting from gameId ${gameId}`);

            disconnectFromGame();
        };
    }, [gameId]);

    const connectToGame = useCallback(async () => {
        if (isOnline || !gameId) return;

        setIsConnecting(true);

        socket.connect();

        socket.emit("join", {
            gameId,
            token: await useTokenAsync(),
        });

        connectionTimeout.current = setTimeout(() => {
            if (!isOnline) {
                setIsConnecting(false);
                resetState();
            }
        }, CONNECTION_TIMEOUT);
    }, [gameId, isOnline]);

    const disconnectFromGame = useCallback(() => {
        socket.disconnect();

        resetState();
    }, []);

    const pause = useCallback(async () => {
        if (!gameId) return;

        if (!["hiding_phase", "main_phase"].includes(state!)) {
            toast.error("Hra není ve stavu, ve kterém lze pozastavit.");
            return;
        }

        const response = await useServer<{ state: "paused" }>(`/games/${gameId}/pause`, {
            token: await useTokenAsync(),
        });

        if (!response.success) return response.consumeError();
    }, [state, gameId]);

    const resume = useCallback(async () => {
        if (!gameId) return;

        if (state !== "paused") {
            toast.error("Hra není pozastavena.");
            return;
        }

        const response = await useServer<{ state: "main_phase" }>(`/games/${gameId}/resume`, {
            token: await useTokenAsync(),
        });

        if (!response.success) return response.consumeError();
    }, [state, gameId]);

    return {
        dynamicData: {
            state: state!,
        },
        functions: {
            pause,
            resume,
            reconnect: connectToGame,
        },
        dynamicDataState: {
            isOnline,
            isConnecting,
        },
    };
};
