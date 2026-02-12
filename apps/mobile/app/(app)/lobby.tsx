import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { getLobbyList } from "@/lib/api";
import type { LobbyInfo, GameType } from "@jetlag/shared-types";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";

export default function LobbyScreen() {
  const { isAuthenticated, setGameId, connectSocket, logout, user } = useAuth();
  const [lobbies, setLobbies] = useState<LobbyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void loadLobbies();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated]);

  const loadLobbies = async () => {
    try {
      setError(null);
      const data = await getLobbyList();
      setLobbies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void loadLobbies();
  };

  const handleJoinGame = (game: LobbyInfo) => {
    setGameId(String(game.id));
    connectSocket(String(game.id));
    router.push("/(app)/game");
  };

  if (!isAuthenticated) return null;

  const statusStyles: Record<string, { bg: string; text: string }> = {
    "not-started": { bg: "#3b82f633", text: "#93c5fd" },
    "in-progress": { bg: "#22c55e33", text: "#86efac" },
    paused: { bg: "#f59e0b33", text: "#fcd34d" },
    ended: { bg: "#6b728033", text: "#d1d5db" },
  };

  const getGameTypeLabel = (type: GameType): string => {
    switch (type) {
      case "hideAndSeek":
        return "Hide and Seek";
      case "roundabout":
        return "Roundabout";
      default:
        return type;
    }
  };

  const getPhaseLabel = (phase: string): string => {
    switch (phase) {
      case "not-started":
        return "Not started";
      case "in-progress":
        return "In progress";
      case "paused":
        return "Paused";
      case "ended":
        return "Ended";
      default:
        return phase;
    }
  };

  const formatGameTime = (time: number): string => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderItem: ListRenderItem<LobbyInfo> = ({ item: game }) => {
    const ended = game.phase === "ended";
    const status = statusStyles[game.phase] ?? statusStyles["not-started"];

    return (
      <NativePressable
        onPress={() => !ended && handleJoinGame(game)}
        disabled={ended}
        className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-[#0f172aee] p-4 active:opacity-90"
      >
        <View style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text className="text-[18px] font-bold text-white">
              {getGameTypeLabel(game.type)}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: status.bg,
              }}
            >
              <Text
                style={{ color: status.text, fontWeight: "700", fontSize: 12 }}
              >
                {getPhaseLabel(game.phase)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text className="text-[13px] text-[#93c5fd]">●</Text>
            <Text className="text-[15px] text-white/70">
              {game.players.online}/{game.players.total} players online
            </Text>
          </View>

          <Text className="text-[15px] text-white/70">
            Duration {formatGameTime(game.gameTime)}
          </Text>

          <View className="mt-1 rounded-2xl bg-white/5 px-3 py-2">
            <Text className="text-[14px] font-medium text-white">
              {ended ? "Game finished" : "Tap to join this game"}
            </Text>
          </View>
        </View>
      </NativePressable>
    );
  };

  const ListHeader = () => (
    <>
      <View className="mb-8">
        <Text className="text-[14px] font-semibold uppercase tracking-[1.2px] text-white/60">
          Lobby
        </Text>
        <Text className="mt-1 text-[34px] font-black text-white">
          Discover games
        </Text>
        {user && (
          <Text className="mt-2 text-[15px] text-white/70">
            Signed in as {user.nickname}
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <NativePressable
            onPress={() => router.push("/(setup)/server")}
            className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <Text className="text-[15px] text-[#93c5fd]">⚙</Text>
            <Text className="text-[15px] text-white">Server</Text>
          </NativePressable>

          <NativePressable
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <Text className="text-[15px] text-[#fca5a5]">⤴</Text>
            <Text className="text-[15px] text-[#fca5a5]">Logout</Text>
          </NativePressable>
        </View>
      </View>

      {error && (
        <View className="mb-4 rounded-2xl bg-[#ef444422] p-4">
          <Text className="text-[15px] text-[#fca5a5]">{error}</Text>
        </View>
      )}
    </>
  );

  const ListEmpty = () =>
    isLoading ? (
      <View style={{ paddingVertical: 48, alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-white/70">Loading games…</Text>
      </View>
    ) : (
      <View style={{ paddingVertical: 48, alignItems: "center" }}>
        <Text className="text-center text-white/70">No active games yet</Text>
        <Text className="mt-2 text-[15px] text-white/60">
          Pull down to refresh
        </Text>
      </View>
    );

  return (
    <ScreenContainer className="bg-[#020617]">
      <View className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#2563eb33]" />
      <View className="absolute top-1/2 -right-20 h-72 w-72 rounded-full bg-[#06b6d433]" />

      <FlatList
        data={lobbies}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 34 : 24,
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a5b4fc"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
