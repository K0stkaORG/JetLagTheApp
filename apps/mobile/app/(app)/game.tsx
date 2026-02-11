import { useEffect } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { GameType } from "@jetlag/shared-types";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";

function HideAndSeekGame({ gameId }: { gameId: string }) {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: "center", paddingTop: 24 }}>
        <Text className="text-foreground text-[22px] font-bold">Hide and Seek</Text>
        <Text className="text-muted-foreground mt-2">Game #{gameId}</Text>
      </View>
    </ScrollView>
  );
}

function RoundaboutGame({ gameId }: { gameId: string }) {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: "center", paddingTop: 24 }}>
        <Text className="text-foreground text-[22px] font-bold">Roundabout</Text>
        <Text className="text-muted-foreground mt-2">Game #{gameId}</Text>
      </View>
    </ScrollView>
  );
}

export default function GameScreen() {
  const { joinPacket, gameId, disconnectSocket, setGameId } = useAuth();

  useEffect(() => {
    if (!gameId) router.replace("/(app)/lobby");
  }, [gameId]);

  const handleLeaveGame = () => {
    disconnectSocket();
    setGameId(null);
    router.replace("/(app)/lobby");
  };

  if (!gameId) return null;

  if (!joinPacket) {
    return (
      <ScreenContainer className="bg-background">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text className="text-foreground text-[17px] mb-2">Connecting…</Text>
          <Text className="text-muted-foreground text-[15px]">Waiting for game data</Text>
        </View>
      </ScreenContainer>
    );
  }

  const gameType: GameType = joinPacket.game.type;
  let gameContent: React.ReactNode;
  switch (gameType) {
    case "hideAndSeek":
      gameContent = <HideAndSeekGame gameId={gameId} />;
      break;
    case "roundabout":
      gameContent = <RoundaboutGame gameId={gameId} />;
      break;
    default:
      gameContent = (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text className="text-foreground text-[17px]">Unknown game: {gameType}</Text>
        </View>
      );
  }

  return (
    <ScreenContainer className="bg-background">
      {gameContent}
      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: Platform.OS === "ios" ? 34 : 24,
        }}>
        <NativePressable
          className="py-4 rounded-xl bg-destructive items-center justify-center"
          onPress={handleLeaveGame}>
          <Text className="text-destructive-foreground font-semibold text-[17px]">Leave game</Text>
        </NativePressable>
      </View>
    </ScreenContainer>
  );
}
