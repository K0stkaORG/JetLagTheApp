import { useAuth } from "@/context/AuthContext";
import { Storage } from "@/lib/storage";
import type { ClientToServerEvents, GameType, Point, ServerToClientEvents, TimelinePhase } from "@jetlag/shared-types";
import { JoinGameDataPacket } from "@jetlag/shared-types";
import * as Location from "expo-location";
import { applyPatches, enablePatches } from "immer";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

enablePatches();

type SocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error" | "shutdown";

export type PlayerState = {
	id: number;
	nickname: string;
	colors: { light: string; dark: string };
	position: { cords: Point; gameTime: number };
	isOnline: boolean;
};

export type GameState = {
	gameId: number;
	type: GameType;
	timeline: {
		sync: Date | null;
		gameTime: number;
		phase: TimelinePhase;
	};
	players: PlayerState[];
	settings: Record<string, unknown>;
	state: Record<string, unknown>;
};

export type GameNotification = {
	id: string;
	message: string;
	timestamp: number;
};

type SocketContextType = {
	status: SocketStatus;
	error: string | null;
	isConnected: boolean;
	emit: (event: keyof ClientToServerEvents, data: unknown) => void;
	gameState: GameState | null;
	notifications: GameNotification[];
	locationStatus: "idle" | "requesting" | "sharing" | "denied" | "error";
	locationError: string | null;
};

const SocketContext = createContext<SocketContextType | null>(null);

/**
 * Socket.IO serializes Date objects to ISO strings over the wire.
 * This restores them back to Date objects so Zod validation (z.date()) passes.
 */
function normalizeJoinDataPacket(data: JoinGameDataPacket): JoinGameDataPacket {
	if (data?.timeline?.sync) {
		return {
			...data,
			timeline: {
				...data.timeline,
				sync: new Date(data.timeline.sync),
			},
		};
	}
	return data;
}

/** Restore Date objects from ISO strings after JSON round-trip through storage */
function deserializeGameState(saved: string): GameState | null {
	try {
		const parsed = JSON.parse(saved);
		if (!parsed?.gameId || !parsed?.type || !parsed?.timeline || !Array.isArray(parsed?.players)) return null;
		return {
			gameId: parsed.gameId,
			type: parsed.type,
			timeline: {
				sync: parsed.timeline.sync ? new Date(parsed.timeline.sync) : null,
				gameTime: parsed.timeline.gameTime,
				phase: parsed.timeline.phase,
			},
			players: parsed.players,
			settings: parsed.settings ?? {},
			state: parsed.state ?? {},
		};
	} catch {
		return null;
	}
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
	const { serverUrl, token, lobby, isInGame, isLoading } = useAuth();
	const [status, setStatus] = useState<SocketStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [notifications, setNotifications] = useState<GameNotification[]>([]);
	const [locationStatus, setLocationStatus] = useState<SocketContextType["locationStatus"]>("idle");
	const [locationError, setLocationError] = useState<string | null>(null);
	const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

	const game = lobby?.[0];
	const gameId = game?.id;

	// Load last known game state from storage on mount (for offline/cold start)
	useEffect(() => {
		async function loadSavedState() {
			const saved = await Storage.getGameData();
			if (!saved) return;
			const restored = deserializeGameState(saved);
			if (restored) {
				// Only set if not already populated (e.g. by a fast joinDataPacket)
				setGameState((prev) => prev ?? restored);
			}
		}
		loadSavedState();
	}, []);

	// Connect/disconnect socket based on auth state
	useEffect(() => {
		// Wait for auth to finish loading before deciding whether to connect
		if (isLoading) return;

		if (!isInGame || !gameId || !serverUrl || !token) {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
				setStatus("idle");
				setError(null);
			}
			setGameState(null);
			setNotifications([]);
			Storage.clearGameData();
			return;
		}

		// Disconnect any existing socket before creating a new one
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		setStatus("connecting");
		setError(null);

		const socket = io(serverUrl, {
			path: "/socket.io",
			auth: {
				token: `${gameId}:${token}`,
			},
			transports: ["websocket"],
		}) as Socket<ServerToClientEvents, ClientToServerEvents>;

		socket.on("connect", () => {
			setStatus("connected");
			setError(null);
		});

		socket.on("disconnect", (reason) => {
			setStatus("disconnected");
			if (reason === "io server disconnect") {
				// Server explicitly disconnected us — try to reconnect manually
				socket.connect();
			}
		});

		socket.on("connect_error", (err) => {
			setStatus("error");
			setError(err.message);
		});

		socket.on("general.game.joinDataPacket", (data) => {
			const normalized = normalizeJoinDataPacket(data);
			const parsed = JoinGameDataPacket.safeParse(normalized);
			if (!parsed.success) {
				setError("Received invalid game data packet");
				return;
			}
			setGameState({
				gameId: parsed.data.game.id,
				type: parsed.data.game.type,
				timeline: {
					sync: parsed.data.timeline.sync,
					gameTime: parsed.data.timeline.gameTime,
					phase: parsed.data.timeline.phase,
				},
				players: parsed.data.players,
				settings: parsed.data.game.settings,
				state: parsed.data.state,
			});
		});

		socket.on("general.error", (data) => {
			setError(data.message);
		});

		socket.on("general.notification", (data) => {
			setNotifications((prev) =>
				[{ id: `${Date.now()}`, message: data.message, timestamp: Date.now() }, ...prev].slice(0, 20),
			);
		});

		socket.on("general.shutdown", () => {
			setStatus("shutdown");
		});

		// Timeline events — normalize Date from ISO string sent by socket.io
		const handleTimeline = (data: { sync: Date | string; gameTime?: number }, phase: TimelinePhase) => {
			setGameState((prev) =>
				prev
					? {
							...prev,
							timeline: {
								sync: data.sync ? new Date(data.sync) : prev.timeline.sync,
								gameTime: data.gameTime ?? prev.timeline.gameTime,
								phase,
							},
						}
					: prev,
			);
		};

		socket.on("general.timeline.start", (data) => handleTimeline(data, "in-progress"));
		socket.on("general.timeline.pause", (data) => handleTimeline(data, "paused"));
		socket.on("general.timeline.resume", (data) => handleTimeline(data, "in-progress"));
		socket.on("general.timeline.end", (data) => {
			setGameState((prev) =>
				prev ? { ...prev, timeline: { ...prev.timeline, gameTime: data.gameTime, phase: "ended" } } : prev,
			);
		});

		socket.on("general.state.update", ({ patches }) => {
			setGameState((prev) => {
				if (!prev) return prev;
				try {
					return { ...prev, state: applyPatches(prev.state, patches) };
				} catch {
					setError("Could not apply a game state update");
					return prev;
				}
			});
		});

		socket.on("general.player.isOnlineUpdate", (data) => {
			setGameState((prev) =>
				prev
					? {
							...prev,
							players: prev.players.map((player) =>
								player.id === data.userId ? { ...player, isOnline: data.isOnline } : player,
							),
						}
					: prev,
			);
		});

		socket.on("general.player.positionUpdate", (data) => {
			setGameState((prev) =>
				prev
					? {
							...prev,
							players: prev.players.map((player) =>
								player.id === data.userId
									? { ...player, position: { cords: data.cords, gameTime: data.gameTime } }
									: player,
							),
						}
					: prev,
			);
		});

		socketRef.current = socket;

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [isLoading, isInGame, gameId, serverUrl, token]);

	// Share location while connected to a game. Coordinates are GeoJSON order: longitude, latitude.
	useEffect(() => {
		let subscription: Location.LocationSubscription | null = null;
		let cancelled = false;

		async function startSharing() {
			if (status !== "connected" || !isInGame) {
				setLocationStatus("idle");
				return;
			}
			setLocationStatus("requesting");
			setLocationError(null);
			const permission = await Location.requestForegroundPermissionsAsync();
			if (cancelled) return;
			if (!permission.granted) {
				setLocationStatus("denied");
				setLocationError("Location permission is required to share your position.");
				return;
			}
			try {
				subscription = await Location.watchPositionAsync(
					{ accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
					({ coords }) => {
						socketRef.current?.emit("general.player.positionUpdate", {
							cords: { type: "Point", coordinates: [coords.longitude, coords.latitude] },
						});
						setLocationStatus("sharing");
					},
					(message) => {
						setLocationStatus("error");
						setLocationError(message);
					},
				);
			} catch (locationError) {
				setLocationStatus("error");
				setLocationError(locationError instanceof Error ? locationError.message : "Location sharing failed");
			}
		}

		startSharing();
		return () => {
			cancelled = true;
			subscription?.remove();
		};
	}, [status, isInGame]);

	// Persist game state to storage (debounced to avoid excessive writes on position updates)
	useEffect(() => {
		if (!gameState) return;
		const timeout = setTimeout(() => {
			Storage.setGameData(gameState);
		}, 1000);
		return () => clearTimeout(timeout);
	}, [gameState]);

	const emit = useCallback((event: keyof ClientToServerEvents, data: unknown) => {
		const socket = socketRef.current;
		if (!socket) return;
		socket.emit(event, data as never);
	}, []);

	return (
		<SocketContext.Provider
			value={{
				status,
				error,
				isConnected: status === "connected",
				emit,
				gameState,
				notifications,
				locationStatus,
				locationError,
			}}>
			{children}
		</SocketContext.Provider>
	);
}

export function useSocket() {
	const context = useContext(SocketContext);
	if (!context) throw new Error("useSocket must be used within SocketProvider");
	return context;
}
