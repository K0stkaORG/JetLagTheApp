import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { JoinGameDataPacket } from "@jetlag/shared-types";
import type { ClientToServerEvents, ServerToClientEvents, User } from "@jetlag/shared-types";
import { io, type Socket } from "socket.io-client";

import { loadJson, saveJson } from "@/lib/storage";

export type LogType = "info" | "error" | "api" | "socket-in" | "socket-out";

export type LogEntry = {
	id: string;
	type: LogType;
	message?: string;
	data?: unknown;
	timestamp: string;
};

export type ApiRequestOptions = {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	body?: unknown;
	headers?: Record<string, string>;
};

type AppContextValue = {
	token: string;
	setToken: (token: string) => void;
	user: User | null;
	setUser: (user: User | null) => void;
	authError: string | null;
	setAuthError: (message: string | null) => void;
	gameId: string;
	setGameId: (gameId: string) => void;
	apiBaseUrl: string;
	setApiBaseUrl: (url: string) => void;
	socketUrl: string;
	setSocketUrl: (url: string) => void;
	logs: LogEntry[];
	addLog: (type: LogType, message?: string, data?: unknown) => void;
	clearLogs: () => void;
	apiRequest: <T = unknown>(options: ApiRequestOptions) => Promise<T>;
	joinPacket: JoinGameDataPacket | null;
	socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
	isConnected: boolean;
	connectSocket: (overrideGameId?: string) => void;
	disconnectSocket: () => void;
	emitSocket: (event: keyof ClientToServerEvents, data: unknown) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "mock-frontend-state";

const defaultApiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
const defaultSocketBase = import.meta.env.VITE_SOCKET_URL || defaultApiBase;

export function AppProvider({ children }: { children: React.ReactNode }) {
	const saved = loadJson<{
		token?: string;
		user?: User | null;
		gameId?: string;
		apiBaseUrl?: string;
		socketUrl?: string;
	}>(STORAGE_KEY);

	const [token, setTokenState] = useState(saved?.token ?? "");
	const [user, setUserState] = useState<User | null>(saved?.user ?? null);
	const [authError, setAuthErrorState] = useState<string | null>(null);
	const [gameId, setGameIdState] = useState(saved?.gameId ?? "");
	const [apiBaseUrl, setApiBaseUrlState] = useState(saved?.apiBaseUrl ?? defaultApiBase);
	const [socketUrl, setSocketUrlState] = useState(saved?.socketUrl ?? defaultSocketBase);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [joinPacket, setJoinPacket] = useState<JoinGameDataPacket | null>(null);
	const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
	const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

	const persist = useCallback(
		(
			next: Partial<{ token: string; user: User | null; gameId: string; apiBaseUrl: string; socketUrl: string }>,
		) => {
			saveJson(STORAGE_KEY, {
				token,
				user,
				gameId,
				apiBaseUrl,
				socketUrl,
				...next,
			});
		},
		[token, user, gameId, apiBaseUrl, socketUrl],
	);

	const setToken = useCallback(
		(nextToken: string) => {
			setTokenState(nextToken);
			setAuthErrorState(null);
			persist({ token: nextToken });
		},
		[persist],
	);

	const setUser = useCallback(
		(nextUser: User | null) => {
			setUserState(nextUser);
			setAuthErrorState(null);
			persist({ user: nextUser });
		},
		[persist],
	);

	const setAuthError = useCallback((message: string | null) => {
		setAuthErrorState(message);
	}, []);

	const setGameId = useCallback(
		(nextGameId: string) => {
			setGameIdState(nextGameId);
			persist({ gameId: nextGameId });
		},
		[persist],
	);

	const setApiBaseUrl = useCallback(
		(next: string) => {
			const cleaned = next.trim().replace(/\/$/, "");
			setApiBaseUrlState(cleaned);
			persist({ apiBaseUrl: cleaned });
		},
		[persist],
	);

	const setSocketUrl = useCallback(
		(next: string) => {
			const cleaned = next.trim().replace(/\/$/, "");
			setSocketUrlState(cleaned);
			persist({ socketUrl: cleaned });
		},
		[persist],
	);

	const addLog = useCallback((type: LogType, message?: string, data?: unknown) => {
		setLogs((prev) => [
			{
				id: crypto.randomUUID(),
				type,
				message,
				data,
				timestamp: new Date().toISOString(),
			},
			...prev,
		]);
	}, []);

	const clearLogs = useCallback(() => setLogs([]), []);

	const disconnectSocket = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}
		setIsConnected(false);
		setSocket(null);
		setJoinPacket(null);
	}, []);

	const apiRequest = useCallback(
		async <T,>({ method, path, body, headers }: ApiRequestOptions): Promise<T> => {
			const url = new URL(path, apiBaseUrl).toString();
			const requestHeaders: Record<string, string> = {
				"Content-Type": "application/json",
				...(headers ?? {}),
			};

			if (token) requestHeaders.Authorization = `Bearer ${token}`;

			addLog("api", `→ ${method} ${url}`, { method, url, headers: requestHeaders, body });

			const start = performance.now();
			const response = await fetch(url, {
				method,
				headers: requestHeaders,
				body: body === undefined ? undefined : JSON.stringify(body),
			});

			const durationMs = Math.round(performance.now() - start);
			const text = await response.text();

			let parsed: unknown = text;
			try {
				parsed = text ? JSON.parse(text) : null;
			} catch {
				parsed = text;
			}

			addLog(response.ok ? "api" : "error", `← ${response.status} ${method} ${url} (${durationMs}ms)`, {
				status: response.status,
				durationMs,
				response: parsed,
			});

			if (response.status === 401 || response.status === 403) {
				setAuthErrorState("Authentication failed. Please sign in again.");
				setTokenState("");
				setUserState(null);
				disconnectSocket();
				persist({ token: "", user: null });
			}

			if (!response.ok) {
				throw new Error(
					typeof parsed === "string" && parsed.length > 0
						? parsed
						: (parsed as { message?: string })?.message || `Request failed (${response.status})`,
				);
			}

			return parsed as T;
		},
		[apiBaseUrl, token, addLog, disconnectSocket, persist],
	);

	const connectSocket = useCallback(
		(overrideGameId?: string) => {
			const targetGameId = overrideGameId ?? gameId;

			if (!targetGameId) {
				addLog("error", "Missing game ID. Set a game ID before connecting.");
				return;
			}

			if (!token) {
				addLog("error", "Missing auth token. Login first.");
				return;
			}

			disconnectSocket();

			const socket = io(socketUrl, {
				path: "/socket.io",
				auth: {
					token: `${targetGameId}:${token}`,
				},
			}) as Socket<ServerToClientEvents, ClientToServerEvents>;

			socket.on("connect", () => {
				setIsConnected(true);
				addLog("info", `Socket connected (${socket.id})`);
			});

			socket.on("disconnect", (reason) => {
				setIsConnected(false);
				addLog("error", `Socket disconnected: ${reason}`);
			});

			socket.on("connect_error", (err) => {
				addLog("error", `Socket connection error: ${err.message}`);
				if (err.message.toLowerCase().includes("authentication")) {
					setAuthErrorState("Socket authentication failed. Please sign in again.");
					setTokenState("");
					setUserState(null);
					persist({ token: "", user: null });
				}
			});

			socket.on("general.game.joinDataPacket", (data) => {
				const normalized = data?.timeline?.sync
					? { ...data, timeline: { ...data.timeline, sync: new Date(data.timeline.sync) } }
					: data;
				const parsed = JoinGameDataPacket.safeParse(normalized);
				if (!parsed.success) {
					addLog("error", "Invalid join data packet", parsed.error.flatten());
					return;
				}
				setJoinPacket(parsed.data);
			});

			socket.onAny((event, ...args) => {
				addLog("socket-in", `${event}`, { event, args });
			});

			socketRef.current = socket;
			setSocket(socket);
		},
		[addLog, disconnectSocket, gameId, socketUrl, token, persist],
	);

	const emitSocket = useCallback(
		(event: keyof ClientToServerEvents, data: unknown) => {
			const socket = socketRef.current;
			if (!socket) {
				addLog("error", "Socket not connected.");
				return;
			}
			socket.emit(event, data as never);
			addLog("socket-out", `${String(event)}`, { event, data });
		},
		[addLog],
	);

	const value = useMemo(
		() => ({
			token,
			setToken,
			user,
			setUser,
			authError,
			setAuthError,
			gameId,
			setGameId,
			apiBaseUrl,
			setApiBaseUrl,
			socketUrl,
			setSocketUrl,
			logs,
			addLog,
			clearLogs,
			apiRequest,
			joinPacket,
			socket,
			isConnected,
			connectSocket,
			disconnectSocket,
			emitSocket,
		}),
		[
			token,
			setToken,
			user,
			setUser,
			authError,
			setAuthError,
			gameId,
			setGameId,
			apiBaseUrl,
			setApiBaseUrl,
			socketUrl,
			setSocketUrl,
			logs,
			addLog,
			clearLogs,
			apiRequest,
			joinPacket,
			socket,
			isConnected,
			connectSocket,
			disconnectSocket,
			emitSocket,
		],
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useAppContext must be used within AppProvider");
	return ctx;
}
