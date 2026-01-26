import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export interface User {
	id: string;
	nickname: string;
}

export interface LogEntry {
	id: string;
	type: "info" | "error" | "socket-in" | "socket-out" | "api";
	data: any;
	timestamp: string;
}

interface AppContextType {
	token: string;
	setToken: (token: string) => void;
	user: User | null;
	setUser: (user: User | null) => void;
	logs: LogEntry[];
	addLog: (type: LogEntry["type"], data: any) => void;
	clearLogs: () => void;
	isConnected: boolean;
	socket: Socket | null;
	connectSocket: () => void;
	disconnectSocket: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [token, setTokenState] = useState<string>(localStorage.getItem("token") || "");
	const [user, setUserState] = useState<User | null>(JSON.parse(localStorage.getItem("user") || "null"));
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const [isConnected, setIsConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	const setToken = useCallback((newToken: string) => {
		setTokenState(newToken);
		if (newToken) {
			localStorage.setItem("token", newToken);
		} else {
			localStorage.removeItem("token");
		}
	}, []);

	const setUser = useCallback((newUser: User | null) => {
		setUserState(newUser);
		if (newUser) {
			localStorage.setItem("user", JSON.stringify(newUser));
		} else {
			localStorage.removeItem("user");
		}
	}, []);

	const addLog = useCallback((type: LogEntry["type"], data: any) => {
		// Avoid circular reference issues when logging generic objects by shallow cloning if simple
		// or relying on react to just render whatever
		setLogs((prev) => [
			{
				id: uuidv4(),
				type,
				data,
				timestamp: new Date().toLocaleTimeString(),
			},
			...prev,
		]);
	}, []);

	const clearLogs = useCallback(() => setLogs([]), []);

	const connectSocket = useCallback(() => {
		if (socketRef.current) socketRef.current.disconnect();

		const socket = io({
			path: "/socket.io",
			auth: { token }, // Pass token if backend uses it
		});

		socket.on("connect", () => {
			setIsConnected(true);
			addLog("info", "Socket Connected: " + socket.id);
		});

		socket.on("disconnect", () => {
			setIsConnected(false);
			addLog("error", "Socket Disconnected");
		});

		socket.on("connect_error", (err) => {
			addLog("error", `Socket Connection Error: ${err.message}`);
		});

		socket.onAny((event, ...args) => {
			addLog("socket-in", { event, args });
		});

		socketRef.current = socket;
	}, [token, addLog]);

	const disconnectSocket = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			setIsConnected(false);
			addLog("info", "Socket Manually Disconnected");
		}
	}, [addLog]);

	useEffect(() => {
		// Auto updating of token in socket if we decide to implement reconnection logic
		// For now simple manual connect/disconnect is fine
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, []);

	return (
		<AppContext.Provider
			value={{
				token,
				setToken,
				user,
				setUser,
				logs,
				addLog,
				clearLogs,
				isConnected,
				socket: socketRef.current,
				connectSocket,
				disconnectSocket,
			}}>
			{children}
		</AppContext.Provider>
	);
}

export function useAppContext() {
	const context = useContext(AppContext);
	if (!context) throw new Error("useAppContext must be used within AppProvider");
	return context;
}
