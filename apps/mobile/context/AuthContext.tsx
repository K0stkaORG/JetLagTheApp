import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  JoinGameDataPacket as JoinGameDataPacketSchema,
  type User,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type JoinGameDataPacket,
} from "@jetlag/shared-types";
import { io, type Socket } from "socket.io-client";
import {
  getToken,
  setToken,
  getUser,
  setUser,
  getApiBaseUrl,
  setApiBaseUrl,
  getSocketUrl,
  setSocketUrl,
} from "@/lib/storage";
import { login, register, revalidate } from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasServerAddress: boolean;
  apiBaseUrl: string;
  socketUrl: string;
  gameId: string | null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isSocketConnected: boolean;
  joinPacket: JoinGameDataPacket | null;
  socketNotifications: string[];
  socketError: string | null;
  authError: string | null;
  setApiBaseUrl: (url: string) => Promise<void>;
  setSocketUrl: (url: string) => Promise<void>;
  setGameId: (gameId: string | null) => void;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  connectSocket: (overrideGameId?: string) => void;
  disconnectSocket: () => void;
  clearSocketMessages: () => void;
  emitSocket: (event: keyof ClientToServerEvents, data: unknown) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_API_BASE =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";
const DEFAULT_SOCKET_BASE = process.env.EXPO_PUBLIC_WS_URL || DEFAULT_API_BASE;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiBaseUrl, setApiBaseUrlState] = useState(DEFAULT_API_BASE);
  const [socketUrl, setSocketUrlState] = useState(DEFAULT_SOCKET_BASE);
  const [gameId, setGameIdState] = useState<string | null>(null);
  const [socket, setSocketState] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [joinPacket, setJoinPacket] = useState<JoinGameDataPacket | null>(null);
  const [socketNotifications, setSocketNotifications] = useState<string[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  // Load initial state from storage
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, storedApiUrl, storedSocketUrl] =
          await Promise.all([
            getToken(),
            getUser<User>(),
            getApiBaseUrl(),
            getSocketUrl(),
          ]);

        if (storedToken) setTokenState(storedToken);
        if (storedUser) setUserState(storedUser);
        if (storedApiUrl) {
          setApiBaseUrlState(storedApiUrl);
        } else {
          // Only use default if it's explicitly set via env var, otherwise require user configuration
          const envApiUrl = process.env.EXPO_PUBLIC_SERVER_URL;
          if (
            envApiUrl &&
            envApiUrl.trim() !== "" &&
            envApiUrl !== "http://localhost:3000"
          ) {
            setApiBaseUrlState(envApiUrl);
          } else {
            setApiBaseUrlState("");
          }
        }
        if (storedSocketUrl) {
          setSocketUrlState(storedSocketUrl);
        } else if (storedApiUrl) {
          setSocketUrlState(storedApiUrl);
        } else {
          // Use same logic for socket URL
          const envSocketUrl = process.env.EXPO_PUBLIC_WS_URL;
          const envApiUrl = process.env.EXPO_PUBLIC_SERVER_URL;
          if (envSocketUrl && envSocketUrl.trim() !== "") {
            setSocketUrlState(envSocketUrl);
          } else if (
            envApiUrl &&
            envApiUrl.trim() !== "" &&
            envApiUrl !== "http://localhost:3000"
          ) {
            setSocketUrlState(envApiUrl);
          } else {
            setSocketUrlState("");
          }
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSetApiBaseUrl = useCallback(
    async (url: string) => {
      const cleaned = url.trim().replace(/\/$/, "");
      setApiBaseUrlState(cleaned);
      await setApiBaseUrl(cleaned);
      // Also update socket URL if it was using the old API URL
      if (!socketUrl || socketUrl === apiBaseUrl) {
        setSocketUrlState(cleaned);
        await setSocketUrl(cleaned);
      }
    },
    [apiBaseUrl, socketUrl],
  );

  const handleSetSocketUrl = useCallback(async (url: string) => {
    const cleaned = url.trim().replace(/\/$/, "");
    setSocketUrlState(cleaned);
    await setSocketUrl(cleaned);
  }, []);

  const handleLogin = useCallback(
    async (nickname: string, password: string) => {
      try {
        setAuthError(null);
        const response = await login({ nickname, password }, apiBaseUrl);
        await setToken(response.token);
        await setUser(response.user);
        setTokenState(response.token);
        setUserState(response.user);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Login failed");
        throw error;
      }
    },
    [apiBaseUrl],
  );

  const handleRegister = useCallback(
    async (nickname: string, password: string) => {
      try {
        setAuthError(null);
        await register({ nickname, password }, apiBaseUrl);
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Registration failed",
        );
        throw error;
      }
    },
    [apiBaseUrl],
  );

  const handleLogout = useCallback(async () => {
    disconnectSocket();
    await setToken(null);
    await setUser(null);
    setTokenState(null);
    setUserState(null);
    setAuthError(null);
  }, []);

  const handleRefreshToken = useCallback(async () => {
    if (!token) return;
    try {
      const response = await revalidate(apiBaseUrl);
      await setToken(response.token);
      setTokenState(response.token);
    } catch (error) {
      // If refresh fails, logout
      await handleLogout();
      throw error;
    }
  }, [token, apiBaseUrl, handleLogout]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsSocketConnected(false);
    setSocketState(null);
    setJoinPacket(null);
  }, []);

  const clearSocketMessages = useCallback(() => {
    setSocketNotifications([]);
    setSocketError(null);
  }, []);

  const connectSocket = useCallback(
    (overrideGameId?: string) => {
      const targetGameId = overrideGameId ?? gameId;

      if (!targetGameId) {
        setSocketError("Missing game ID. Set a game ID before connecting.");
        return;
      }

      if (!token) {
        setSocketError("Missing auth token. Login first.");
        return;
      }

      disconnectSocket();

      setSocketNotifications([]);
      setSocketError(null);

      const socket = io(socketUrl, {
        path: "/socket.io",
        auth: {
          token: `${targetGameId}:${token}`,
        },
      }) as Socket<ServerToClientEvents, ClientToServerEvents>;

      socket.on("connect", () => {
        setIsSocketConnected(true);
        setSocketError(null);
        console.log(`Socket connected (${socket.id})`);
      });

      socket.on("disconnect", (reason) => {
        setIsSocketConnected(false);
        setSocketError(`Socket disconnected: ${reason}`);
        setSocketNotifications((prev) =>
          [`Socket disconnected: ${reason}`, ...prev].slice(0, 20),
        );
        console.log(`Socket disconnected: ${reason}`);
      });

      socket.on("connect_error", (err) => {
        console.log(`Socket connection error: ${err.message}`);
        setSocketError(err.message);
        setSocketNotifications((prev) =>
          [`Socket error: ${err.message}`, ...prev].slice(0, 20),
        );
        if (err.message.toLowerCase().includes("authentication")) {
          setAuthError("Socket authentication failed. Please sign in again.");
          handleLogout();
        }
      });

      socket.on("general.game.joinDataPacket", (data) => {
        const normalized = data?.timeline?.sync
          ? {
              ...data,
              timeline: {
                ...data.timeline,
                sync: new Date(data.timeline.sync),
              },
            }
          : data;
        const parsed = JoinGameDataPacketSchema.safeParse(normalized);
        if (!parsed.success) {
          setSocketError("Invalid game packet received");
          return;
        }
        setJoinPacket(parsed.data);
      });

      socket.on("general.notification", (data) => {
        setSocketNotifications((prev) => [data.message, ...prev].slice(0, 20));
      });

      socket.on("general.error", (data) => {
        setSocketError(data.message);
        setSocketNotifications((prev) =>
          [`Error: ${data.message}`, ...prev].slice(0, 20),
        );
      });

      socket.on("general.timeline.start", (data) => {
        setJoinPacket((prev) =>
          prev
            ? {
                ...prev,
                timeline: {
                  ...prev.timeline,
                  phase: "in-progress",
                  sync: new Date(data.sync),
                },
              }
            : prev,
        );
      });

      socket.on("general.timeline.pause", (data) => {
        setJoinPacket((prev) =>
          prev
            ? {
                ...prev,
                timeline: {
                  ...prev.timeline,
                  phase: "paused",
                  gameTime: data.gameTime,
                  sync: new Date(data.sync),
                },
              }
            : prev,
        );
      });

      socket.on("general.timeline.resume", (data) => {
        setJoinPacket((prev) =>
          prev
            ? {
                ...prev,
                timeline: {
                  ...prev.timeline,
                  phase: "in-progress",
                  gameTime: data.gameTime,
                  sync: new Date(data.sync),
                },
              }
            : prev,
        );
      });

      socket.on("general.player.isOnlineUpdate", (data) => {
        setJoinPacket((prev) =>
          prev
            ? {
                ...prev,
                players: prev.players.map((player) =>
                  player.id === data.userId
                    ? { ...player, isOnline: data.isOnline }
                    : player,
                ),
              }
            : prev,
        );
      });

      socket.on("general.player.positionUpdate", (data) => {
        setJoinPacket((prev) =>
          prev
            ? {
                ...prev,
                players: prev.players.map((player) =>
                  player.id === data.userId
                    ? {
                        ...player,
                        position: {
                          cords: data.cords,
                          gameTime: data.gameTime,
                        },
                      }
                    : player,
                ),
              }
            : prev,
        );
      });

      socket.on("general.shutdown", () => {
        setSocketError("Server requested shutdown");
        disconnectSocket();
      });

      socket.onAny((event, ...args) => {
        console.log(`Socket event: ${event}`, args);
      });

      socketRef.current = socket;
      setSocketState(socket);
    },
    [gameId, socketUrl, token, disconnectSocket, handleLogout],
  );

  const emitSocket = useCallback(
    (event: keyof ClientToServerEvents, data: unknown) => {
      const socket = socketRef.current;
      if (!socket) {
        setSocketError("Socket not connected.");
        return;
      }
      socket.emit(event, data as never);
    },
    [],
  );

  // Check if server address is configured (not empty and not just the default localhost)
  const hasServerAddress = apiBaseUrl !== "" && apiBaseUrl.trim().length > 0;

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: !!token && !!user,
      hasServerAddress,
      apiBaseUrl,
      socketUrl,
      gameId,
      socket,
      isSocketConnected,
      joinPacket,
      socketNotifications,
      socketError,
      authError,
      setApiBaseUrl: handleSetApiBaseUrl,
      setSocketUrl: handleSetSocketUrl,
      setGameId: setGameIdState,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      refreshToken: handleRefreshToken,
      connectSocket,
      disconnectSocket,
      clearSocketMessages,
      emitSocket,
    }),
    [
      token,
      user,
      isLoading,
      hasServerAddress,
      apiBaseUrl,
      socketUrl,
      gameId,
      socket,
      isSocketConnected,
      joinPacket,
      socketNotifications,
      socketError,
      authError,
      handleSetApiBaseUrl,
      handleSetSocketUrl,
      handleLogin,
      handleRegister,
      handleLogout,
      handleRefreshToken,
      connectSocket,
      disconnectSocket,
      clearSocketMessages,
      emitSocket,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
