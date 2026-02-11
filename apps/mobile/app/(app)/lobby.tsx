import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  ListRenderItem,
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
    if (isAuthenticated) loadLobbies();
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
    loadLobbies();
  };

  const handleJoinGame = (game: LobbyInfo) => {
    setGameId(String(game.id));
    connectSocket(String(game.id));
    router.push("/(app)/game");
  };

  useEffect(() => {
    if (!isAuthenticated) router.replace("/(auth)/login");
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const getGameTypeLabel = (type: GameType): string => {
    switch (type) {
      case "hideAndSeek": return "Hide and Seek";
      case "roundabout": return "Roundabout";
      default: return type;
    }
  };

  const getPhaseLabel = (phase: string): string => {
    switch (phase) {
      case "not-started": return "Not started";
      case "in-progress": return "In progress";
      case "paused": return "Paused";
      case "ended": return "Ended";
      default: return phase;
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
    return (
      <NativePressable
        onPress={() => !ended && handleJoinGame(game)}
        disabled={ended}
        className="bg-card active:opacity-80">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: 4,
          }}>
          <View style={{ flex: 1 }}>
            <Text className="text-foreground text-[17px] font-semibold">
              {getGameTypeLabel(game.type)}
            </Text>
            <Text className="text-muted-foreground text-[15px] mt-1">
              {formatGameTime(game.gameTime)} · {game.players.online}/{game.players.total} players
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor:
                game.phase === "in-progress"
                  ? "rgba(52,199,89,0.2)"
                  : game.phase === "paused"
                    ? "rgba(255,204,0,0.2)"
                    : game.phase === "ended"
                      ? "rgba(142,142,147,0.2)"
                      : "rgba(10,132,255,0.2)",
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color:
                  game.phase === "in-progress"
                    ? "#34c759"
                    : game.phase === "paused"
                      ? "#ffcc00"
                      : game.phase === "ended"
                        ? "#8e8e93"
                        : "#0a84ff",
              }}>
              {getPhaseLabel(game.phase)}
            </Text>
          </View>
          {!ended && (
            <Text style={{ marginLeft: 8, fontSize: 20, color: "#8e8e93" }}>›</Text>
          )}
        </View>
      </NativePressable>
    );
  };

  const ItemSeparator = () => (
    <View
      style={{
        height: 1,
        marginLeft: 4,
        backgroundColor: "rgba(60,60,67,0.18)",
      }}
    />
  );

  const ListHeader = () => (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text className="text-foreground text-[22px] font-bold">Games</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <NativePressable onPress={() => router.push("/(setup)/server")} className="py-2 px-3">
            <Text className="text-primary text-[15px]">Settings</Text>
          </NativePressable>
          <NativePressable
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            className="py-2 px-3">
            <Text className="text-muted-foreground text-[15px]">Log out</Text>
          </NativePressable>
        </View>
      </View>
      {user && (
        <Text className="text-muted-foreground text-[15px] mb-4">{user.nickname}</Text>
      )}
      {error && (
        <View className="mb-4 p-4 rounded-xl bg-destructive/15">
          <Text className="text-destructive text-[15px]">{error}</Text>
        </View>
      )}
    </>
  );

  const ListEmpty = () =>
    isLoading ? (
      <View style={{ paddingVertical: 48, alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text className="text-muted-foreground mt-4">Loading games…</Text>
      </View>
    ) : (
      <View style={{ paddingVertical: 48, alignItems: "center" }}>
        <Text className="text-muted-foreground text-center">No games yet</Text>
        <Text className="text-muted-foreground text-[15px] mt-2">Pull down to refresh</Text>
      </View>
    );

  return (
    <ScreenContainer className="bg-background">
      <FlatList
        data={lobbies}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "ios" ? 34 : 24,
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8e8e93" />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
