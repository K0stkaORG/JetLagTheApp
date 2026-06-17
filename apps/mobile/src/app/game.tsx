import GameTime from "@/components/GameTime";
import Map from "@/components/map";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import type { TimelinePhase } from "@jetlag/shared-types";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const phaseColors: Record<TimelinePhase, string> = {
	"not-started": "#888888",
	"in-progress": "#22c55e",
	paused: "#f59e0b",
	ended: "#ef4444",
};

function formatNotificationTime(timestamp: number): string {
	const date = new Date(timestamp);
	return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

export default function GameScreen() {
	const { lobby, user, logout } = useAuth();
	const { status: socketStatus, error: socketError, gameState, notifications } = useSocket();

	const game = lobby?.[0];

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

	// Prefer live game state; fall back to lobby snapshot while socket data hasn't arrived
	const timeline = gameState?.timeline ?? {
		sync: null,
		gameTime: game.gameTime,
		phase: game.phase,
	};

	const onlineCount = gameState ? gameState.players.filter((p) => p.isOnline).length : game.players.online;
	const totalCount = gameState ? gameState.players.length : game.players.total;

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
						{/* Game time + phase */}
						<View style={styles.timeSection}>
							<View style={styles.timeHeader}>
								<Text style={styles.sectionLabel}>Game Time</Text>
								<View style={[styles.phaseBadge, { backgroundColor: phaseColors[timeline.phase] }]}>
									<Text style={styles.phaseText}>{timeline.phase}</Text>
								</View>
							</View>
							<GameTime
								sync={timeline.sync}
								gameTime={timeline.gameTime}
								phase={timeline.phase}
								style={styles.timeDisplay}
							/>
							<Text style={styles.gameMeta}>
								Game #{game.id} · {game.type}
							</Text>
						</View>

						{/* Players */}
						<View style={styles.section}>
							<Text style={styles.sectionLabel}>
								Players ({onlineCount}/{totalCount} online)
							</Text>
							{gameState ? (
								gameState.players.map((player) => (
									<View
										key={player.id}
										style={styles.playerRow}>
										<View
											style={[
												styles.playerDot,
												{
													backgroundColor: player.colors.light,
													borderColor: player.colors.dark,
												},
											]}
										/>
										<View style={styles.playerInfo}>
											<Text style={styles.playerName}>{player.nickname}</Text>
											<Text style={styles.playerCoords}>
												{player.position.cords[0].toFixed(4)},{" "}
												{player.position.cords[1].toFixed(4)}
											</Text>
										</View>
										<View style={styles.playerStatus}>
											<View
												style={[
													styles.statusDot,
													{ backgroundColor: player.isOnline ? "#22c55e" : "#ccc" },
												]}
											/>
											<Text
												style={[
													styles.playerStatusText,
													{ color: player.isOnline ? "#22c55e" : "#999" },
												]}>
												{player.isOnline ? "Online" : "Offline"}
											</Text>
										</View>
									</View>
								))
							) : (
								<Text style={styles.loadingText}>Waiting for game data...</Text>
							)}
						</View>

						{/* Notifications */}
						{notifications.length > 0 && (
							<View style={styles.section}>
								<Text style={styles.sectionLabel}>Activity</Text>
								{notifications.map((note) => (
									<View
										key={note.id}
										style={styles.notificationRow}>
										<Text style={styles.notificationTime}>
											{formatNotificationTime(note.timestamp)}
										</Text>
										<Text style={styles.notificationMessage}>{note.message}</Text>
									</View>
								))}
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
		maxHeight: "50%",
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
	emptyText: {
		fontSize: 16,
		color: "#888",
		textAlign: "center",
		marginBottom: 16,
	},
	// Time section
	timeSection: {
		gap: 8,
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 12,
		backgroundColor: "#f9f9f9",
	},
	timeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionLabel: {
		fontSize: 12,
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
		fontWeight: "600",
	},
	phaseBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	phaseText: {
		fontSize: 11,
		color: "#fff",
		fontWeight: "600",
		textTransform: "capitalize",
	},
	timeDisplay: {
		fontSize: 36,
		fontWeight: "700",
		fontVariant: ["tabular-nums"],
		color: "#333",
	},
	gameMeta: {
		fontSize: 13,
		color: "#888",
	},
	// Sections
	section: {
		gap: 8,
		marginBottom: 16,
	},
	// Player rows
	playerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	playerDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
	},
	playerInfo: {
		flex: 1,
		gap: 2,
	},
	playerName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#333",
	},
	playerCoords: {
		fontSize: 12,
		color: "#999",
		fontVariant: ["tabular-nums"],
	},
	playerStatus: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	playerStatusText: {
		fontSize: 12,
		fontWeight: "500",
	},
	loadingText: {
		fontSize: 14,
		color: "#999",
		fontStyle: "italic",
		paddingVertical: 8,
	},
	// Notifications
	notificationRow: {
		flexDirection: "row",
		gap: 8,
		paddingVertical: 6,
	},
	notificationTime: {
		fontSize: 12,
		color: "#aaa",
		fontVariant: ["tabular-nums"],
	},
	notificationMessage: {
		fontSize: 14,
		color: "#555",
		flex: 1,
	},
});
