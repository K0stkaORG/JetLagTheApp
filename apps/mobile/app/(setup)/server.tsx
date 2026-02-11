import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";

export default function ServerConfigScreen() {
  const { apiBaseUrl, socketUrl, setApiBaseUrl, setSocketUrl } = useAuth();
  const [apiUrl, setApiUrl] = useState(apiBaseUrl);
  const [wsUrl, setWsUrl] = useState(socketUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!apiUrl.trim()) {
      setError("API URL is required");
      return;
    }
    try {
      const cleanedApiUrl = apiUrl.trim().replace(/\/$/, "");
      const cleanedWsUrl = wsUrl.trim().replace(/\/$/, "") || cleanedApiUrl;
      setIsLoading(true);
      const testUrl = new URL("/health", cleanedApiUrl).toString();
      const response = await fetch(testUrl, { method: "GET" });
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      await setApiBaseUrl(cleanedApiUrl);
      await setSocketUrl(cleanedWsUrl);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach server");
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="text-foreground text-[28px] font-bold mb-2">Server</Text>
          <Text className="text-muted-foreground text-[15px] mb-8">
            Enter the game server address to connect
          </Text>

          {error && (
            <View className="mb-4 p-4 rounded-xl bg-destructive/15">
              <Text className="text-destructive text-[15px]">{error}</Text>
            </View>
          )}

          <Text className="text-foreground text-[13px] font-semibold mb-2 uppercase tracking-wide opacity-70">
            API URL
          </Text>
          <TextInput
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-[17px] mb-5"
            placeholder="https://api.example.com"
            placeholderTextColor="#8e8e93"
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isLoading}
          />

          <Text className="text-foreground text-[13px] font-semibold mb-2 uppercase tracking-wide opacity-70">
            WebSocket URL (optional)
          </Text>
          <TextInput
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-[17px] mb-8"
            placeholder="Same as API if left blank"
            placeholderTextColor="#8e8e93"
            value={wsUrl}
            onChangeText={setWsUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isLoading}
          />

          <NativePressable
            className="w-full py-4 rounded-xl bg-primary items-center justify-center"
            onPress={handleSave}
            disabled={isLoading || !apiUrl.trim()}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-[17px]">Connect</Text>
            )}
          </NativePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
