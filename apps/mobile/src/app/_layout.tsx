import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootLayoutNav() {
	const { isLoading, serverUrl, token, isInGame } = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const navigationState = useRootNavigationState();

	useEffect(() => {
		if (isLoading || !navigationState?.key) return;

		const currentRoute = segments[0] || "index";

		if (!serverUrl) {
			if (currentRoute !== "server") router.replace("/server");
		} else if (!token) {
			if (currentRoute !== "login") router.replace("/login");
		} else if (isInGame) {
			if (currentRoute !== "game") router.replace("/game");
		} else {
			if (currentRoute !== "lobby") router.replace("/lobby");
		}
	}, [isLoading, serverUrl, token, isInGame, segments, navigationState?.key]);

	return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<RootLayoutNav />
		</AuthProvider>
	);
}
