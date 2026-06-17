import Map from "@/components/map";
import { useAuth } from "@/context/AuthContext";
import type { JoinGameDataPacket } from "@jetlag/shared-types";
import { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

export default function GameScreen() {
	const { lobby, serverUrl, token, user, gameData, setGameData, logout } = useAuth();
	const [socketStatus, setSocketStatus] = useState("connecting");
	const [socketError, setSocketError] = useState<string | null>(null);

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

		socket.on("general.game.joinDataPacket", (data: JoinGameDataPacket) => {
			console.log("Join data packet:", data);
			setGameData(data);
		});

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

		socket.on("general.timeline.pause", (data: { gameTime: number; sync: Date }) => {
			console.log("Timeline paused:", data);
		});

		socket.on("general.timeline.resume", (data: { gameTime: number; sync: Date }) => {
			console.log("Timeline resumed:", data);
		});

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
				<Button
					title="Logout"
					onPress={logout}
				/>
			</SafeAreaView>
		);
	}

	const statusColor =
		socketStatus === "connected" ? "#44ff44" : socketStatus === "connecting" ? "#ffaa00" : "#ff4444";

	return (
		<SafeAreaView
			style={styles.container}
			edges={["left", "right"]}>
			<Map mapStyle="https://tiles.openfreemap.org/styles/liberty" />

			<View
				style={styles.overlay}
				pointerEvents="box-none">
				<View style={styles.topBar}>
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
				</View>

				<View style={styles.bottomPanel}>
					<ScrollView
						style={styles.bottomScroll}
						contentContainerStyle={styles.bottomScrollContent}>
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
								<Text style={styles.infoValue}>{JSON.stringify(gameData, null, 2)}</Text>
							</View>
						)}
					</ScrollView>

					<View style={styles.footer}>
						<Button
							title="Logout"
							onPress={logout}
							color="#ff4444"
						/>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		padding: 20,
		justifyContent: "space-between",
	},
	topBar: {
		gap: 12,
	},
	bottomPanel: {
		backgroundColor: "rgba(255,255,255,0.92)",
		borderRadius: 16,
		overflow: "hidden",
		maxHeight: "45%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	bottomScroll: {
		padding: 16,
	},
	bottomScrollContent: {
		paddingBottom: 8,
	},
	header: {
		gap: 4,
		padding: 12,
		backgroundColor: "rgba(255,255,255,0.92)",
		borderRadius: 12,
		alignSelf: "flex-start",
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
		padding: 8,
		backgroundColor: "rgba(255,255,255,0.92)",
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
		padding: 12,
		backgroundColor: "rgba(255,255,255,0.92)",
		borderRadius: 8,
		alignSelf: "stretch",
		textAlign: "center",
	},
	footer: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: "#eee",
		backgroundColor: "rgba(255,255,255,0.92)",
	},
});
