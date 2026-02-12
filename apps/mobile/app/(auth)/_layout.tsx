import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated, hasServerAddress, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If no server address, redirect to setup
  if (!hasServerAddress) {
    return <Redirect href="/(setup)/server" />;
  }

  // If already authenticated, redirect to lobby
  if (isAuthenticated) {
    return <Redirect href="/(app)/lobby" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
