import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { isAuthenticated, hasServerAddress, gameId, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If no server address, redirect to setup
  if (!hasServerAddress) {
    return <Redirect href="/(setup)/server" />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="lobby" options={{ title: "Lobby" }} />
      <Stack.Screen name="game" options={{ title: "Game", headerShown: false }} />
      <Stack.Screen name="map" options={{ title: "Map" }} />
    </Stack>
  );
}

