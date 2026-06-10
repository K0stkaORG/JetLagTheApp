import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

export default function GameScreen() {
  const { lobby, serverUrl, token, user, logout } = useAuth();
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [socketError, setSocketError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<Record<string, unknown> | null>(
    null,
  );

  const game = lobby?.[0];
  const gameId = game?.id;

  useEffect(() => {
    if (!gameId || !serverUrl || !token) return;

    setSocketStatus("connecting");
    setSocketError(null);

    const socket: Socket = io(serverUrl, {
      auth: {
        token: `${gameId}:${token}`,
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      setSocketError(null);
    });

    socket.on("disconnect", (reason) => {
      setSocketStatus("disconnected");
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect manually
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      setSocketStatus("error");
      setSocketError(err.message);
    });

    socket.on(
      "general.game.joinDataPacket",
      (data: Record<string, unknown>) => {
        console.log("Join data packet:", data);
        setGameData(data);
      },
    );

    socket.on("general.notification", (data: { message: string }) => {
      console.log("Notification:", data.message);
    });

    socket.on("general.error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
      setSocketError(data.message);
    });

    socket.on("general.timeline.start", (data: { sync: Date }) => {
      console.log("Timeline started:", data.sync);
    });

    socket.on(
      "general.timeline.pause",
      (data: { gameTime: number; sync: Date }) => {
        console.log("Timeline paused:", data);
      },
    );

    socket.on(
      "general.timeline.resume",
      (data: { gameTime: number; sync: Date }) => {
        console.log("Timeline resumed:", data);
      },
    );

    socket.on("general.shutdown", () => {
      console.log("Server shutdown");
      setSocketStatus("shutdown");
    });

    // Game-specific socket events can be added here

    return () => {
      socket.disconnect();
    };
  }, [gameId, serverUrl, token]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Game</Text>
        <Text style={styles.emptyText}>No game data available</Text>
        <Button title="Logout" onPress={logout} />
      </SafeAreaView>
    );
  }

  const statusColor =
    socketStatus === "connected"
      ? "#44ff44"
      : socketStatus === "connecting"
        ? "#ffaa00"
        : "#ff4444";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Game</Text>
          {user && <Text style={styles.welcome}>Welcome, {user.nickname}</Text>}
        </View>

        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>
            {socketStatus.charAt(0).toUpperCase() + socketStatus.slice(1)}
          </Text>
        </View>

        {socketError && <Text style={styles.error}>{socketError}</Text>}

        <View style={styles.gameInfo}>
          <Text style={styles.infoLabel}>Game ID</Text>
          <Text style={styles.infoValue}>{game.id}</Text>

          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>{game.type}</Text>

          <Text style={styles.infoLabel}>Phase</Text>
          <Text style={styles.infoValue}>{game.phase}</Text>

          <Text style={styles.infoLabel}>Game Time</Text>
          <Text style={styles.infoValue}>{game.gameTime}</Text>

          <Text style={styles.infoLabel}>Players</Text>
          <Text style={styles.infoValue}>
            {game.players.online}/{game.players.total} online
          </Text>
        </View>

        {gameData && (
          <View style={styles.gameData}>
            <Text style={styles.infoLabel}>Game Data</Text>
            <Text style={styles.infoValue}>
              {JSON.stringify(gameData, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Logout" onPress={logout} color="#ff4444" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  welcome: {
    fontSize: 16,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  gameInfo: {
    gap: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  gameData: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  error: {
    color: "#ff4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  footer: {
    marginTop: 16,
    paddingBottom: 20,
  },
});
