import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { isValidCords, type GameType } from "@jetlag/shared-types";
import * as Location from "expo-location";
import MapLibreGL from "@maplibre/maplibre-react-native";

import { useAuth } from "@/context/AuthContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";

MapLibreGL.setAccessToken(null);

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function formatPhase(phase: string) {
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
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function HideAndSeekGame({
  gameId,
  playerCount,
}: {
  gameId: string;
  playerCount: number;
}) {
  return (
    <View className="mb-4 rounded-3xl border border-white/10 bg-[#0f172a] p-5">
      <Text className="text-[20px] font-bold text-white">Hide and Seek</Text>
      <Text className="mt-2 text-white/70">Game #{gameId}</Text>
      <Text className="mt-2 text-white/70">
        Players in lobby: {playerCount}
      </Text>
      <Text className="mt-4 text-[14px] text-white/70">
        Evaders stay unseen while chasers track movement. Keep location sharing
        enabled for fair play.
      </Text>
    </View>
  );
}

function RoundaboutGame({
  gameId,
  playerCount,
}: {
  gameId: string;
  playerCount: number;
}) {
  return (
    <View className="mb-4 rounded-3xl border border-white/10 bg-[#0f172a] p-5">
      <Text className="text-[20px] font-bold text-white">Roundabout</Text>
      <Text className="mt-2 text-white/70">Game #{gameId}</Text>
      <Text className="mt-2 text-white/70">
        Players in lobby: {playerCount}
      </Text>
      <Text className="mt-4 text-[14px] text-white/70">
        Coordinate routes, share positions, and react quickly to live updates
        from your team.
      </Text>
    </View>
  );
}

export default function GameScreen() {
  const {
    joinPacket,
    gameId,
    disconnectSocket,
    setGameId,
    isSocketConnected,
    emitSocket,
    socketNotifications,
    socketError,
    clearSocketMessages,
    user,
  } = useAuth();

  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);

  const [followUser, setFollowUser] = useState(true);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );
  const [lastSharedAt, setLastSharedAt] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [displayGameTime, setDisplayGameTime] = useState<number | null>(null);

  useEffect(() => {
    if (!gameId) router.replace("/(app)/lobby");
  }, [gameId]);

  useEffect(() => {
    if (!joinPacket) {
      setDisplayGameTime(null);
      return;
    }

    const compute = () => {
      if (joinPacket.timeline.phase !== "in-progress")
        return joinPacket.timeline.gameTime;
      const syncTime = new Date(joinPacket.timeline.sync).getTime();
      const deltaSeconds = (Date.now() - syncTime) / 1000;
      return joinPacket.timeline.gameTime + deltaSeconds;
    };

    setDisplayGameTime(compute());

    if (joinPacket.timeline.phase !== "in-progress") return;

    const interval = setInterval(() => {
      setDisplayGameTime(compute());
    }, 250);

    return () => clearInterval(interval);
  }, [joinPacket]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const startSharing = async () => {
      try {
        setLocationError(null);

        const currentPermission =
          await Location.getForegroundPermissionsAsync();
        let granted = currentPermission.status === "granted";

        if (!granted) {
          const requested = await Location.requestForegroundPermissionsAsync();
          granted = requested.status === "granted";
        }

        if (!isMounted) return;
        setLocationPermission(granted);

        if (!granted) {
          setLocationError("Location permission is required for sharing");
          setIsLocationSharing(false);
          return;
        }

        locationWatcherRef.current?.remove();
        locationWatcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (position) => {
            const nextCords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            emitSocket("general.player.positionUpdate", { cords: nextCords });
            setLastSharedAt(new Date());
          },
        );
      } catch (error) {
        if (!isMounted) return;
        setLocationError(
          error instanceof Error
            ? error.message
            : "Failed to start location sharing",
        );
        setIsLocationSharing(false);
      }
    };

    if (isLocationSharing) {
      startSharing();
    } else {
      locationWatcherRef.current?.remove();
      locationWatcherRef.current = null;
    }

    return () => {
      isMounted = false;
    };
  }, [isLocationSharing, emitSocket]);

  useEffect(() => {
    return () => {
      locationWatcherRef.current?.remove();
      locationWatcherRef.current = null;
      clearSocketMessages();
    };
  }, [clearSocketMessages]);

  const handleLeaveGame = () => {
    locationWatcherRef.current?.remove();
    locationWatcherRef.current = null;
    setIsLocationSharing(false);
    disconnectSocket();
    setGameId(null);
    router.replace("/(app)/lobby");
  };

  const players = joinPacket?.players ?? [];

  const mappedPlayers = players
    .filter((player) => isValidCords(player.position.cords))
    .map((player) => ({
      ...player,
      coordinate: [player.position.cords[1], player.position.cords[0]] as [
        number,
        number,
      ],
    }));

  if (!gameId) return null;

  if (!joinPacket) {
    return (
      <ScreenContainer className="bg-[#020617]">
        <View className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#3b82f633]" />
        <View className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-[#14b8a633]" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text className="text-[20px] font-semibold text-white">
            Connecting…
          </Text>
          <Text className="mt-2 text-[15px] text-white/70">
            Waiting for live game data
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const gameType: GameType = joinPacket.game.type;
  const playerCount = joinPacket.players.length;
  const ownPlayerId = user?.id;

  const firstCoordinate = mappedPlayers[0]?.coordinate;

  let gameContent;
  switch (gameType) {
    case "hideAndSeek":
      gameContent = (
        <HideAndSeekGame gameId={gameId} playerCount={playerCount} />
      );
      break;
    case "roundabout":
      gameContent = (
        <RoundaboutGame gameId={gameId} playerCount={playerCount} />
      );
      break;
    default:
      gameContent = (
        <View className="mb-4 rounded-3xl border border-white/10 bg-[#0f172a] p-5">
          <Text className="text-[17px] text-white">
            Unknown game: {gameType}
          </Text>
        </View>
      );
  }

  return (
    <ScreenContainer className="bg-[#020617]">
      <View className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#3b82f633]" />
      <View className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-[#14b8a633]" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 rounded-3xl border border-white/10 bg-[#0b1222ee] p-5">
          <Text className="text-[14px] font-semibold uppercase tracking-[1.2px] text-white/60">
            Live game
          </Text>
          <Text className="mt-1 text-[30px] font-black text-white">
            Game #{gameId}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: isSocketConnected ? "#86efac" : "#fca5a5",
              }}
            />
            <Text className="text-[14px] text-white/70">
              {isSocketConnected ? "Connected" : "Reconnecting"}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-white/10 bg-[#0f172a] p-4">
            <Text className="text-[12px] uppercase tracking-[1.2px] text-white/60">
              Phase
            </Text>
            <Text className="mt-1 text-[18px] font-bold text-white">
              {formatPhase(joinPacket.timeline.phase)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-white/10 bg-[#0f172a] p-4">
            <Text className="text-[12px] uppercase tracking-[1.2px] text-white/60">
              Game time
            </Text>
            <Text className="mt-1 text-[18px] font-bold text-white">
              {formatTime(displayGameTime ?? joinPacket.timeline.gameTime)}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row gap-3">
          <NativePressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-3"
            onPress={() => setFollowUser((prev) => !prev)}
          >
            <Text className="text-[14px] text-[#bfdbfe]">
              {followUser ? "◎" : "◌"}
            </Text>
            <Text className="text-[14px] font-semibold text-white">
              {followUser ? "Following me" : "Free pan"}
            </Text>
          </NativePressable>

          <NativePressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 ${
              isLocationSharing
                ? "bg-[#22c55e]"
                : "border border-white/10 bg-white/10"
            }`}
            onPress={() => setIsLocationSharing((prev) => !prev)}
          >
            <Text className="text-[14px] text-white">⇄</Text>
            <Text className="text-[14px] font-semibold text-white">
              {isLocationSharing ? "Sharing on" : "Share location"}
            </Text>
          </NativePressable>
        </View>

        {(socketError || locationError) && (
          <View className="mb-4 rounded-2xl bg-[#ef444422] p-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-[14px] text-[#fca5a5]">⚠</Text>
              <Text className="flex-1 text-[14px] text-[#fca5a5]">
                {socketError ?? locationError}
              </Text>
            </View>
          </View>
        )}

        <View className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]">
          <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
            <Text className="text-[15px] font-semibold text-white">
              Live positions
            </Text>
            <Text className="text-[13px] text-white/70">
              {lastSharedAt
                ? `Sent ${lastSharedAt.toLocaleTimeString()}`
                : "Not sharing"}
            </Text>
          </View>

          <View style={{ height: 260 }}>
            <MapLibreGL.MapView
              style={{ flex: 1 }}
              mapStyle={OPENFREEMAP_STYLE}
              logoEnabled={false}
              attributionEnabled={true}
              attributionPosition={{ bottom: 8, right: 8 }}
            >
              <MapLibreGL.Camera
                followUserLocation={followUser && locationPermission === true}
                followZoomLevel={15}
                animationMode="flyTo"
                animationDuration={600}
                zoomLevel={13}
                centerCoordinate={firstCoordinate}
              />
              <MapLibreGL.UserLocation visible={true} />

              {mappedPlayers.map((player) => (
                <MapLibreGL.PointAnnotation
                  key={`player-${player.id}`}
                  id={`player-${player.id}`}
                  coordinate={player.coordinate}
                >
                  <View
                    style={{
                      minWidth: 28,
                      minHeight: 28,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor:
                        player.id === ownPlayerId ? "#ffffff" : "#93c5fd",
                      backgroundColor: player.colors.dark || "#2563eb",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </MapLibreGL.PointAnnotation>
              ))}
            </MapLibreGL.MapView>
          </View>
        </View>

        {gameContent}

        <View className="mb-4 rounded-3xl border border-white/10 bg-[#0f172a] p-5">
          <View className="mb-4 flex-row items-center gap-2">
            <Text className="text-[16px] text-[#93c5fd]">●</Text>
            <Text className="text-[18px] font-bold text-white">Players</Text>
          </View>

          <View className="gap-3">
            {joinPacket.players.map((player) => (
              <View
                key={player.id}
                className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <Text className="text-[15px] font-medium text-white">
                  {player.nickname}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: player.isOnline ? "#22c55e" : "#6b7280",
                    }}
                  />
                  <Text className="text-[13px] text-white/70">
                    {player.isOnline ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-4 rounded-3xl border border-white/10 bg-[#0f172a] p-5">
          <Text className="mb-3 text-[18px] font-bold text-white">
            Notifications
          </Text>
          {socketNotifications.length === 0 ? (
            <Text className="text-[14px] text-white/60">
              No notifications yet.
            </Text>
          ) : (
            <View className="gap-2">
              {socketNotifications.slice(0, 5).map((note, index) => (
                <View
                  key={`${note}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <Text className="text-[14px] text-white/80">{note}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: Platform.OS === "ios" ? 34 : 24,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <NativePressable
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4"
          onPress={() => router.push("/(app)/map")}
          haptic={false}
        >
          <Text className="text-[16px] text-[#bfdbfe]">⌖</Text>
          <Text className="text-[16px] font-semibold text-white">
            Open full map
          </Text>
        </NativePressable>

        <NativePressable
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#ef4444] py-4"
          onPress={handleLeaveGame}
        >
          <Text className="text-[16px] text-white">⤴</Text>
          <Text className="text-[16px] font-semibold text-white">Leave</Text>
        </NativePressable>
      </View>
    </ScreenContainer>
  );
}
