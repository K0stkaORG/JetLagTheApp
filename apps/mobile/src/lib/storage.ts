import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
	SERVER_URL: "jetlag_server_url",
	AUTH_TOKEN: "jetlag_auth_token",
	AUTH_USER: "jetlag_auth_user",
	IS_IN_GAME: "jetlag_is_in_game",
	LOBBY: "jetlag_lobby",
	GAME_DATA: "jetlag_game_data",
} as const;

export const Storage = {
	async getServerUrl(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
	},

	async setServerUrl(url: string): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
	},

	async clearServerUrl(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.SERVER_URL);
	},

	async getToken(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
	},

	async setToken(token: string): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
	},

	async clearToken(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
	},

	async getUser(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
	},

	async setUser(user: Record<string, unknown>): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
	},

	async clearUser(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
	},

	async getIsInGame(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.IS_IN_GAME);
	},

	async setIsInGame(value: boolean): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.IS_IN_GAME, value ? "true" : "false");
	},

	async clearIsInGame(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.IS_IN_GAME);
	},

	async getLobby(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.LOBBY);
	},

	async setLobby(lobby: unknown): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.LOBBY, JSON.stringify(lobby));
	},

	async clearLobby(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.LOBBY);
	},

	async getGameData(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.GAME_DATA);
	},

	async setGameData(gameData: unknown): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(gameData));
	},

	async clearGameData(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEYS.GAME_DATA);
	},

	async clearAll(): Promise<void> {
		await AsyncStorage.multiRemove([
			STORAGE_KEYS.SERVER_URL,
			STORAGE_KEYS.AUTH_TOKEN,
			STORAGE_KEYS.AUTH_USER,
			STORAGE_KEYS.IS_IN_GAME,
			STORAGE_KEYS.LOBBY,
			STORAGE_KEYS.GAME_DATA,
		]);
	},
};
