import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { AuthProvider } from "@/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const bgColor = "#020617";

  useEffect(() => {
    // Set status bar background to match app background
    SystemUI.setBackgroundColorAsync(bgColor);
  }, [bgColor]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bgColor },
            animation: "fade_from_bottom",
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="(setup)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
