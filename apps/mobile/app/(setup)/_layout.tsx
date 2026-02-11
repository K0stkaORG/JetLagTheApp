import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function SetupLayout() {
  const { hasServerAddress, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If server address is already configured, redirect to login
  if (hasServerAddress) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="server" options={{ headerShown: false }} />
    </Stack>
  );
}
