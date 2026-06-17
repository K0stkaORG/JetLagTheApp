import { APIError, createAPIClient } from "@/lib/api";
import { Storage } from "@/lib/storage";
import type { LobbyListResponse, User } from "@jetlag/shared-types";
import * as Network from "expo-network";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthState = {
	isLoading: boolean;
	serverUrl: string | null;
	token: string | null;
	user: User | null;
	isInGame: boolean;
	lobby: LobbyListResponse | null;
	error: string | null;
};

type AuthContextType = AuthState & {
	setServerUrl: (url: string) => Promise<boolean>;
	clearServerUrl: () => Promise<void>;
	login: (nickname: string, password: string) => Promise<{ isInGame: boolean }>;
	register: (nickname: string, password: string) => Promise<{ isInGame: boolean }>;
	logout: () => Promise<void>;
	refreshLobby: () => Promise<void>;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({
		isLoading: true,
		serverUrl: null,
		token: null,
		user: null,
		isInGame: false,
		lobby: null,
		error: null,
	});

	// Tracks whether we are in offline-reconnect mode so we can auto-refresh when the connection returns
	const isOfflineRef = useRef(false);
	const stateRef = useRef(state);
	stateRef.current = state;
	const refreshLobbyRef = useRef<() => Promise<void>>(async () => {});

	// Initialize: check storage and revalidate token
	useEffect(() => {
		async function init() {
			try {
				const serverUrl = await Storage.getServerUrl();
				if (!serverUrl) {
					setState((s) => ({ ...s, isLoading: false, serverUrl: null }));
					return;
				}

				const token = await Storage.getToken();
				if (!token) {
					setState((s) => ({ ...s, isLoading: false, serverUrl, token: null }));
					return;
				}

				const userJson = await Storage.getUser();
				const user = userJson ? (JSON.parse(userJson) as User) : null;

				// Try to revalidate token
				const api = createAPIClient(serverUrl);
				const { token: newToken } = await api.revalidate(token);
				await Storage.setToken(newToken);

				// Check lobby
				const lobby = await api.getLobby(newToken);
				const isInGame = lobby.length > 0;

				await Storage.setIsInGame(isInGame);
				await Storage.setLobby(lobby);

				if (!isInGame) {
					await Storage.clearGameData();
				}

				isOfflineRef.current = false;
				setState((s) => ({
					...s,
					isLoading: false,
					serverUrl,
					token: newToken,
					user,
					isInGame,
					lobby,
					error: null,
				}));
			} catch (error) {
				const savedIsInGame = await Storage.getIsInGame();
				const wasInGame = savedIsInGame === "true";

				if (!(error instanceof APIError) && wasInGame) {
					// Network error but user was connected to a game:
					// Load up the last known state and wait in background for reconnect
					isOfflineRef.current = true;
					const savedServerUrl = await Storage.getServerUrl();
					const savedToken = await Storage.getToken();
					const savedUserJson = await Storage.getUser();
					const savedUser = savedUserJson ? (JSON.parse(savedUserJson) as User) : null;
					const savedLobbyJson = await Storage.getLobby();
					const savedLobby = savedLobbyJson ? (JSON.parse(savedLobbyJson) as LobbyListResponse) : null;

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: savedToken,
						user: savedUser,
						isInGame: true,
						lobby: savedLobby,
						error: "Connection lost. Waiting to reconnect...",
					}));
				} else if (error instanceof APIError && wasInGame) {
					// API error when connected to a game: disconnect user and try lobby
					isOfflineRef.current = false;
					await Storage.clearToken();
					await Storage.clearUser();
					await Storage.clearIsInGame();
					await Storage.clearLobby();
					await Storage.clearGameData();
					const savedServerUrl = await Storage.getServerUrl();

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: null,
						user: null,
						isInGame: false,
						lobby: null,
						error: error.message,
					}));
				} else {
					// Existing flow
					isOfflineRef.current = false;
					await Storage.clearToken();
					await Storage.clearUser();
					await Storage.clearIsInGame();
					await Storage.clearLobby();
					await Storage.clearGameData();
					const savedServerUrl = await Storage.getServerUrl();

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: null,
						user: null,
						isInGame: false,
						lobby: null,
						error: error instanceof APIError ? error.message : "Failed to connect to server",
					}));
				}
			}
		}

		init();
	}, []);

	const setServerUrl = async (url: string): Promise<boolean> => {
		try {
			let normalizedUrl = url.trim();
			if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
				normalizedUrl = "https://" + normalizedUrl;
			}
			normalizedUrl = normalizedUrl.replace(/\/$/, "");

			const api = createAPIClient(normalizedUrl);
			await api.healthCheck();
			await Storage.setServerUrl(normalizedUrl);
			isOfflineRef.current = false;
			setState((s) => ({ ...s, serverUrl: normalizedUrl, error: null }));
			return true;
		} catch (error) {
			setState((s) => ({
				...s,
				error: error instanceof APIError ? error.message : "Server is not reachable",
			}));
			return false;
		}
	};

	const clearServerUrl = async () => {
		isOfflineRef.current = false;
		await Storage.clearAll();
		setState((s) => ({
			...s,
			serverUrl: null,
			token: null,
			user: null,
			isInGame: false,
			lobby: null,
			error: null,
		}));
	};

	const login = async (nickname: string, password: string): Promise<{ isInGame: boolean }> => {
		if (!state.serverUrl) throw new Error("No server URL configured");

		const api = createAPIClient(state.serverUrl);
		const response = await api.login(nickname, password);
		await Storage.setToken(response.token);
		await Storage.setUser(response.user);

		let lobby: LobbyListResponse = [];
		try {
			lobby = await api.getLobby(response.token);
		} catch {
			// If lobby fetch fails, default to empty lobby
		}
		const isInGame = lobby.length > 0;

		await Storage.setIsInGame(isInGame);
		await Storage.setLobby(lobby);

		isOfflineRef.current = false;
		setState((s) => ({
			...s,
			token: response.token,
			user: response.user,
			isInGame,
			lobby,
			error: null,
		}));

		return { isInGame };
	};

	const register = async (nickname: string, password: string): Promise<{ isInGame: boolean }> => {
		if (!state.serverUrl) throw new Error("No server URL configured");

		const api = createAPIClient(state.serverUrl);
		await api.register(nickname, password);
		return login(nickname, password);
	};

	const logout = async () => {
		isOfflineRef.current = false;
		await Storage.clearToken();
		await Storage.clearUser();
		await Storage.clearIsInGame();
		await Storage.clearLobby();
		await Storage.clearGameData();
		setState((s) => ({
			...s,
			token: null,
			user: null,
			isInGame: false,
			lobby: null,
			error: null,
		}));
	};

	const refreshLobby = async () => {
		if (!state.token || !state.serverUrl) return;
		try {
			const api = createAPIClient(state.serverUrl);
			const lobby = await api.getLobby(state.token);
			const isInGame = lobby.length > 0;
			await Storage.setIsInGame(isInGame);
			await Storage.setLobby(lobby);
			if (!isInGame) {
				await Storage.clearGameData();
			}
			isOfflineRef.current = false;
			setState((s) => ({
				...s,
				lobby,
				isInGame,
				error: null,
			}));
		} catch (error) {
			setState((s) => ({
				...s,
				error: error instanceof APIError ? error.message : "Failed to refresh lobby",
			}));
		}
	};

	refreshLobbyRef.current = refreshLobby;

	// Listen for network changes. When we come back online in offline-reconnect mode, refresh the lobby.
	useEffect(() => {
		const subscription = Network.addNetworkStateListener((networkState) => {
			const online = networkState.isConnected && networkState.isInternetReachable !== false;
			if (!online) {
				isOfflineRef.current = true;
			} else if (isOfflineRef.current && stateRef.current.token && stateRef.current.serverUrl) {
				refreshLobbyRef.current();
			}
		});
		return () => subscription.remove();
	}, []);

	const clearError = () => {
		setState((s) => ({ ...s, error: null }));
	};

	return (
		<AuthContext.Provider
			value={{
				...state,
				setServerUrl,
				clearServerUrl,
				login,
				register,
				logout,
				refreshLobby,
				clearError,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
}
