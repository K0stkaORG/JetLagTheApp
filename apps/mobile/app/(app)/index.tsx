import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View } from "react-native";

export default function HomeScreen() {
  const { gameId, isLoading, isAuthenticated } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  // Only redirect if authenticated, otherwise let root layout handle it
  if (!isAuthenticated) {
    return <View style={{ flex: 1 }} />;
  }

  // Redirect based on game state
  if (gameId) {
    return <Redirect href="/(app)/game" />;
  }

  return <Redirect href="/(app)/lobby" />;
}

