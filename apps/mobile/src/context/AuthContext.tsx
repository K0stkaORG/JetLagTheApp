import React, { createContext, useContext, useEffect, useState } from "react";
import { Storage } from "@/lib/storage";
import { createAPIClient, APIError } from "@/lib/api";
import type { LobbyListResponse, User } from "@jetlag/shared-types";

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
  register: (
    nickname: string,
    password: string,
  ) => Promise<{ isInGame: boolean }>;
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
          // Load up the last known gamestate and wait in background for reconnect
          const savedServerUrl = await Storage.getServerUrl();
          const savedToken = await Storage.getToken();
          const savedUserJson = await Storage.getUser();
          const savedUser = savedUserJson
            ? (JSON.parse(savedUserJson) as User)
            : null;
          const savedLobbyJson = await Storage.getLobby();
          const savedLobby = savedLobbyJson
            ? (JSON.parse(savedLobbyJson) as LobbyListResponse)
            : null;

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
          await Storage.clearToken();
          await Storage.clearUser();
          await Storage.clearIsInGame();
          await Storage.clearLobby();
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
          await Storage.clearToken();
          await Storage.clearUser();
          await Storage.clearIsInGame();
          await Storage.clearLobby();
          const savedServerUrl = await Storage.getServerUrl();

          setState((s) => ({
            ...s,
            isLoading: false,
            serverUrl: savedServerUrl,
            token: null,
            user: null,
            isInGame: false,
            lobby: null,
            error:
              error instanceof APIError
                ? error.message
                : "Failed to connect to server",
          }));
        }
      }
    }

    init();
  }, []);

  const setServerUrl = async (url: string): Promise<boolean> => {
    try {
      let normalizedUrl = url.trim();
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      normalizedUrl = normalizedUrl.replace(/\/$/, "");

      const api = createAPIClient(normalizedUrl);
      await api.healthCheck();
      await Storage.setServerUrl(normalizedUrl);
      setState((s) => ({ ...s, serverUrl: normalizedUrl, error: null }));
      return true;
    } catch (error) {
      setState((s) => ({
        ...s,
        error:
          error instanceof APIError ? error.message : "Server is not reachable",
      }));
      return false;
    }
  };

  const clearServerUrl = async () => {
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

  const login = async (
    nickname: string,
    password: string,
  ): Promise<{ isInGame: boolean }> => {
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

  const register = async (
    nickname: string,
    password: string,
  ): Promise<{ isInGame: boolean }> => {
    if (!state.serverUrl) throw new Error("No server URL configured");

    const api = createAPIClient(state.serverUrl);
    await api.register(nickname, password);
    return login(nickname, password);
  };

  const logout = async () => {
    await Storage.clearToken();
    await Storage.clearUser();
    await Storage.clearIsInGame();
    await Storage.clearLobby();
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
      setState((s) => ({ ...s, lobby, isInGame }));
    } catch (error) {
      setState((s) => ({
        ...s,
        error:
          error instanceof APIError ? error.message : "Failed to refresh lobby",
      }));
    }
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
