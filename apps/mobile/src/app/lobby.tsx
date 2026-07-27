import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import type { LobbyInfo } from "@jetlag/shared-types";
import { useEffect, useMemo, useState } from "react";
import { Button, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LobbyScreen() {
	const { lobby, user, logout, refreshLobby, error } = useAuth();
	const [refreshing, setRefreshing] = useState(false);
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	useEffect(() => {
		refreshLobby();
	}, []);

	const handleRefresh = async () => {
		setRefreshing(true);
		await refreshLobby();
		setRefreshing(false);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Lobby</Text>
				{user && <Text style={styles.welcome}>Welcome, {user.nickname}</Text>}
			</View>

			{error && <Text style={styles.error}>{error}</Text>}

			<ScrollView
				style={styles.content}
				contentContainerStyle={
					lobby && lobby.length > 0
						? styles.listContent
						: { flexGrow: 1, justifyContent: "center", alignItems: "center" }
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={theme.text}
					/>
				}>
				{lobby && lobby.length > 0 ? (
					lobby.map((item: LobbyInfo) => (
						<View
							key={item.id}
							style={styles.gameItem}>
							<Text style={styles.gameTitle}>
								Game {item.id} — {item.type}
							</Text>
							<Text style={styles.gameDetail}>Phase: {item.phase}</Text>
							<Text style={styles.gameDetail}>
								Players: {item.players.online}/{item.players.total} online
							</Text>
							<Text style={styles.gameDetail}>Game Time: {item.gameTime}</Text>
						</View>
					))
				) : (
					<Text style={styles.emptyText}>No active games. Wait for an admin to add you to a game.</Text>
				)}
			</ScrollView>

			<View style={styles.footer}>
				<Button
					title="Logout"
					onPress={logout}
					color="#ff4444"
				/>
			</View>
		</SafeAreaView>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
	StyleSheet.create({
		container: {
			flex: 1,
			padding: 20,
			backgroundColor: theme.background,
		},
		header: {
			marginBottom: 16,
			gap: 4,
		},
		title: {
			fontSize: 28,
			fontWeight: "700",
			color: theme.text,
		},
		welcome: {
			fontSize: 16,
			color: theme.textSecondary,
		},
		content: {
			flex: 1,
		},
		listContent: {
			gap: 12,
			paddingBottom: 20,
		},
		gameItem: {
			padding: 16,
			borderWidth: 1,
			borderColor: theme.border,
			borderRadius: 12,
			backgroundColor: theme.backgroundElement,
			gap: 4,
		},
		gameTitle: {
			fontSize: 18,
			fontWeight: "600",
			color: theme.text,
		},
		gameDetail: {
			fontSize: 14,
			color: theme.textSecondary,
		},
		emptyText: {
			fontSize: 16,
			color: theme.textSecondary,
			textAlign: "center",
			paddingHorizontal: 20,
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
