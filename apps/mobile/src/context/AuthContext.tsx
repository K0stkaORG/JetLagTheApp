import { APIError, createAPIClient } from "@/lib/api";
import { Storage } from "@/lib/storage";
import type { GetDatasetResponse, LobbyListResponse, User } from "@jetlag/shared-types";
import * as Network from "expo-network";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthState = {
	isLoading: boolean;
	serverUrl: string | null;
	token: string | null;
	user: User | null;
	isInGame: boolean;
	activeGameId: number | null;
	lobby: LobbyListResponse | null;
	datasets: Record<number, GetDatasetResponse>;
	error: string | null;
};

type AuthContextType = AuthState & {
	setServerUrl: (url: string) => Promise<boolean>;
	clearServerUrl: () => Promise<void>;
	login: (nickname: string, password: string) => Promise<{ isInGame: boolean }>;
	register: (nickname: string, password: string) => Promise<{ isInGame: boolean }>;
	logout: () => Promise<void>;
	refreshLobby: () => Promise<void>;
	setActiveGame: (gameId: number) => Promise<void>;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function loadDatasets(
	serverUrl: string,
	token: string,
	lobby: LobbyListResponse,
): Promise<Record<number, GetDatasetResponse>> {
	const saved = await Storage.getDatasets();
	let datasets: Record<number, GetDatasetResponse> = {};
	try {
		datasets = saved ? JSON.parse(saved) : {};
	} catch {
		datasets = {};
	}

	const api = createAPIClient(serverUrl);
	await Promise.all(
		[...new Set(lobby.map((game) => game.datasetId))].map(async (datasetId) => {
			try {
				datasets[datasetId] = await api.getDataset(token, datasetId);
			} catch {
				// Keep a cached dataset when refreshing it is temporarily unavailable.
			}
		}),
	);
	await Storage.setDatasets(datasets);
	return datasets;
}

/** Pick which game to connect to: keep the preferred one if still in the lobby, else the first. */
function resolveActiveGameId(lobby: LobbyListResponse | null, preferred: number | null): number | null {
	if (!lobby || lobby.length === 0) return null;
	if (preferred != null && lobby.some((game) => game.id === preferred)) return preferred;
	return lobby[0].id;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({
		isLoading: true,
		serverUrl: null,
		token: null,
		user: null,
		isInGame: false,
		activeGameId: null,
		lobby: null,
		datasets: {},
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
				const datasets = await loadDatasets(serverUrl, newToken, lobby);
				const isInGame = lobby.length > 0;

				const savedActiveGameId = await Storage.getActiveGameId();
				const activeGameId = resolveActiveGameId(
					lobby,
					savedActiveGameId != null ? Number(savedActiveGameId) : null,
				);

				await Storage.setIsInGame(isInGame);
				await Storage.setLobby(lobby);
				await Storage.setActiveGameId(activeGameId);

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
					activeGameId,
					lobby,
					datasets,
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
					const savedDatasetsJson = await Storage.getDatasets();
					const savedDatasets = savedDatasetsJson ? JSON.parse(savedDatasetsJson) : {};
					const savedActiveGameId = await Storage.getActiveGameId();

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: savedToken,
						user: savedUser,
						isInGame: true,
						activeGameId: resolveActiveGameId(
							savedLobby,
							savedActiveGameId != null ? Number(savedActiveGameId) : null,
						),
						lobby: savedLobby,
						datasets: savedDatasets,
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
					await Storage.clearActiveGameId();
					const savedServerUrl = await Storage.getServerUrl();

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: null,
						user: null,
						isInGame: false,
						activeGameId: null,
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
					await Storage.clearActiveGameId();
					const savedServerUrl = await Storage.getServerUrl();

					setState((s) => ({
						...s,
						isLoading: false,
						serverUrl: savedServerUrl,
						token: null,
						user: null,
						isInGame: false,
						activeGameId: null,
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
			activeGameId: null,
			lobby: null,
			datasets: {},
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
		const datasets = await loadDatasets(state.serverUrl, response.token, lobby);
		const isInGame = lobby.length > 0;
		const activeGameId = resolveActiveGameId(lobby, null);

		await Storage.setIsInGame(isInGame);
		await Storage.setLobby(lobby);
		await Storage.setActiveGameId(activeGameId);

		isOfflineRef.current = false;
		setState((s) => ({
			...s,
			token: response.token,
			user: response.user,
			isInGame,
			activeGameId,
			lobby,
			datasets,
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
		await Storage.clearActiveGameId();
		setState((s) => ({
			...s,
			token: null,
			user: null,
			isInGame: false,
			activeGameId: null,
			lobby: null,
			error: null,
		}));
	};

	const setActiveGame = async (gameId: number) => {
		if (stateRef.current.activeGameId === gameId) return;
		await Storage.setActiveGameId(gameId);
		// The saved game snapshot belongs to the previously active game
		await Storage.clearGameData();
		setState((s) => ({ ...s, activeGameId: gameId }));
	};

	const refreshLobby = async () => {
		if (!state.token || !state.serverUrl) return;
		try {
			const api = createAPIClient(state.serverUrl);
			const lobby = await api.getLobby(state.token);
			const datasets = await loadDatasets(state.serverUrl, state.token, lobby);
			const isInGame = lobby.length > 0;
			const activeGameId = resolveActiveGameId(lobby, stateRef.current.activeGameId);
			await Storage.setIsInGame(isInGame);
			await Storage.setLobby(lobby);
			await Storage.setActiveGameId(activeGameId);
			if (!isInGame) {
				await Storage.clearGameData();
			}
			isOfflineRef.current = false;
			setState((s) => ({
				...s,
				lobby,
				datasets,
				isInGame,
				activeGameId,
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
				setActiveGame,
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
