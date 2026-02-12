import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { isAuthenticated, hasServerAddress, isLoading } = useAuth();

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
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="lobby" />
      <Stack.Screen name="game" />
      <Stack.Screen name="map" />
    </Stack>
  );
}
