import GameTime from "@/components/GameTime";
import Map from "@/components/map";
import { DEFAULT_STYLE } from "@/constants/map";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useTheme } from "@/hooks/use-theme";
import { getTeam } from "@/lib/questions";
import type { TimelinePhase } from "@jetlag/shared-types";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const phaseColors: Record<TimelinePhase, string> = {
	"not-started": "#888888",
	"in-progress": "#22c55e",
	paused: "#f59e0b",
	ended: "#ef4444",
};

function withOpacity(hex: string, opacity: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${opacity})`;
}

function formatNotificationTime(timestamp: number): string {
	const date = new Date(timestamp);
	return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

type FloatingPanel = "info" | "players" | null;

export default function GameScreen() {
	const { lobby, datasets, user, activeGameId } = useAuth();
	const router = useRouter();
	const {
		status: socketStatus,
		error: socketError,
		gameState,
		notifications,
		locationStatus,
		locationError,
	} = useSocket();
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const insets = useSafeAreaInsets();
	const [openPanel, setOpenPanel] = useState<FloatingPanel>(null);

	const togglePanel = (panel: Exclude<FloatingPanel, null>) =>
		setOpenPanel((current) => (current === panel ? null : panel));

	const game = lobby?.find((item) => item.id === activeGameId) ?? lobby?.[0];

	if (!game) {
		return (
			<SafeAreaView style={styles.container}>
				<Pressable
					style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
					onPress={() => router.replace("/lobby")}>
					<SymbolView
						name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
						size={20}
						weight="bold"
						tintColor={theme.text}
					/>
				</Pressable>
				<View style={styles.emptyState}>
					<Text style={styles.title}>Game</Text>
					<Text style={styles.emptyText}>No game data available</Text>
				</View>
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

	const { gamePhase } = getTeam(gameState, user);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["left", "right"]}>
			<Map mapStyle={DEFAULT_STYLE}>
				{gameState?.players.map((player) => (
					<GeoJSONSource
						key={player.id}
						id={`player-${player.id}`}
						data={player.position.cords}>
						<Layer
							type="circle"
							id={`player-circle-${player.id}`}
							paint={{
								"circle-radius": 8,
								"circle-color": player.colors.light,
								"circle-stroke-color": player.colors.dark,
								"circle-stroke-width": 3,
							}}
						/>
					</GeoJSONSource>
				))}
			</Map>

			<View
				style={styles.overlay}
				pointerEvents="box-none">
				{/* Floating top section: pills row + expandable panels */}
				<View
					style={[styles.topSection, { marginTop: insets.top + 8 }]}
					pointerEvents="box-none">
					<View
						style={styles.topRow}
						pointerEvents="box-none">
						<Pressable
							style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
							onPress={() => router.push("/lobby")}>
							<SymbolView
								name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
								size={20}
								weight="bold"
								tintColor={theme.text}
							/>
						</Pressable>

						{/* Floating game time + phase pill (centered on screen) */}
						<View
							style={styles.timePillWrapper}
							pointerEvents="box-none">
							<Pressable
								style={({ pressed }) => [styles.timePill, pressed && styles.pressed]}
								onPress={() => togglePanel("info")}>
								<View style={[styles.phaseDot, { backgroundColor: phaseColors[timeline.phase] }]} />
								<GameTime
									sync={timeline.sync}
									gameTime={timeline.gameTime}
									phase={timeline.phase}
									style={styles.pillTime}
								/>
								<SymbolView
									name={{
										ios: openPanel === "info" ? "chevron.up" : "chevron.down",
										android: openPanel === "info" ? "expand_less" : "expand_more",
										web: openPanel === "info" ? "expand_less" : "expand_more",
									}}
									size={14}
									weight="bold"
									tintColor={theme.textSecondary}
								/>
							</Pressable>
						</View>

						{/* Players toggle */}
						<Pressable
							style={({ pressed }) => [
								styles.playersButton,
								openPanel === "players" && styles.playersButtonActive,
								pressed && styles.pressed,
							]}
							onPress={() => togglePanel("players")}>
							<SymbolView
								name={{ ios: "person.2.fill", android: "group", web: "group" }}
								size={18}
								tintColor={theme.text}
							/>
							<Text style={styles.playersCount}>
								{onlineCount}/{totalCount}
							</Text>
						</Pressable>
					</View>

					{/* Expandable info panel (from the time pill) */}
					{openPanel === "info" && (
						<View style={[styles.floatingPanel, styles.infoPanel]}>
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
							<Text style={styles.gameMeta}>
								Location:{" "}
								{locationStatus === "sharing"
									? gamePhase === "hiding"
										? "sharing (hiding phase — your spot is chosen from your position)"
										: "sharing"
									: timeline.phase === "in-progress"
										? locationStatus
										: "not required until the game starts"}
							</Text>
							{datasets[game.datasetId] && (
								<Text style={styles.gameMeta}>
									Dataset: {datasets[game.datasetId].metadata.name} v
									{datasets[game.datasetId].version}
								</Text>
							)}
							{gameState?.state && Object.keys(gameState.state).length > 0 && (
								<Text style={styles.gameMeta}>Mode state: {JSON.stringify(gameState.state)}</Text>
							)}
							<View style={styles.statusRow}>
								<View style={[styles.statusDot, { backgroundColor: statusColor }]} />
								<Text style={styles.statusText}>
									{socketStatus.charAt(0).toUpperCase() + socketStatus.slice(1)}
								</Text>
							</View>
							{socketError && <Text style={styles.error}>{socketError}</Text>}
							{locationError && <Text style={styles.error}>{locationError}</Text>}
						</View>
					)}

					{/* Expandable players panel */}
					{openPanel === "players" && (
						<ScrollView
							style={[styles.floatingPanel, styles.playersPanel]}
							contentContainerStyle={styles.playersPanelContent}>
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
												{player.position.cords.coordinates[0].toFixed(4)},{" "}
												{player.position.cords.coordinates[1].toFixed(4)}
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
						</ScrollView>
					)}
				</View>

				{/* Bottom panel: activity */}
				{notifications.length > 0 && (
					<View style={styles.bottomPanel}>
						<ScrollView
							style={styles.bottomScroll}
							contentContainerStyle={styles.bottomScrollContent}>
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
						</ScrollView>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) => {
	const panel = withOpacity(theme.backgroundElement, 0.92);

	return StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.background,
		},
		overlay: {
			position: "absolute",
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
			paddingHorizontal: 16,
			paddingBottom: 16,
			justifyContent: "space-between",
			gap: 12,
		},
		// Top section
		topSection: {
			gap: 8,
		},
		topRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 12,
		},
		timePillWrapper: {
			position: "absolute",
			left: 0,
			right: 0,
			alignItems: "center",
		},
		backButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: panel,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4,
		},
		pressed: {
			opacity: 0.7,
		},
		timePill: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			paddingHorizontal: 16,
			paddingVertical: 10,
			backgroundColor: panel,
			borderRadius: 24,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4,
		},
		phaseDot: {
			width: 10,
			height: 10,
			borderRadius: 5,
		},
		pillTime: {
			fontSize: 20,
			fontWeight: "700",
			fontVariant: ["tabular-nums"],
			color: theme.text,
		},
		playersButton: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			height: 40,
			paddingHorizontal: 12,
			borderRadius: 20,
			backgroundColor: panel,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4,
		},
		playersButtonActive: {
			backgroundColor: theme.backgroundSelected,
		},
		playersCount: {
			fontSize: 14,
			fontWeight: "600",
			fontVariant: ["tabular-nums"],
			color: theme.text,
		},
		// Floating expandable panels
		floatingPanel: {
			backgroundColor: panel,
			borderRadius: 16,
			padding: 16,
			gap: 8,
			maxHeight: 320,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4,
		},
		infoPanel: {
			alignSelf: "center",
			minWidth: "70%",
		},
		playersPanel: {
			alignSelf: "flex-end",
			width: "85%",
		},
		playersPanelContent: {
			gap: 8,
		},
		bottomPanel: {
			backgroundColor: panel,
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
		title: {
			fontSize: 28,
			fontWeight: "700",
			color: theme.text,
		},
		statusRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		statusDot: {
			width: 10,
			height: 10,
			borderRadius: 5,
		},
		statusText: {
			fontSize: 14,
			fontWeight: "600",
			color: theme.text,
		},
		error: {
			color: "#ff4444",
			fontSize: 14,
		},
		emptyState: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			gap: 8,
		},
		emptyText: {
			fontSize: 16,
			color: theme.textSecondary,
			textAlign: "center",
			marginBottom: 16,
		},
		// Time info
		timeHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		sectionLabel: {
			fontSize: 12,
			color: theme.textSecondary,
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
			color: theme.text,
		},
		gameMeta: {
			fontSize: 13,
			color: theme.textSecondary,
		},
		// Sections
		section: {
			gap: 8,
		},
		// Player rows
		playerRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 10,
			paddingVertical: 8,
			borderBottomWidth: 1,
			borderBottomColor: theme.border,
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
			color: theme.text,
		},
		playerCoords: {
			fontSize: 12,
			color: theme.textSecondary,
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
			color: theme.textSecondary,
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
			color: theme.textSecondary,
			fontVariant: ["tabular-nums"],
		},
		notificationMessage: {
			fontSize: 14,
			color: theme.textSecondary,
			flex: 1,
		},
	});
};
