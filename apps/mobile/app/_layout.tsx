import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { AuthProvider } from "@/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#0a0a0a" : "#ffffff";

  useEffect(() => {
    // Set status bar background to match app background
    SystemUI.setBackgroundColorAsync(bgColor);
  }, [bgColor]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bgColor },
            animation: "slide_from_right",
            fullScreenGestureEnabled: true,
          }}>
          <Stack.Screen name="(setup)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}