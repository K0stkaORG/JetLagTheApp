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
import { ArrowRight, Server, Wifi } from "lucide-react-native";

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
      if (!response.ok)
        throw new Error(`Server responded with status ${response.status}`);
      await setApiBaseUrl(cleanedApiUrl);
      await setSocketUrl(cleanedWsUrl);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach server");
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-[#030712]">
      <View className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#0ea5e933]" />
      <View className="absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[#6366f133]" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8">
            <Text className="text-[34px] font-black text-white">
              Connect server
            </Text>
            <Text className="mt-2 text-[15px] text-white/70">
              Set where this app should fetch and stream game data.
            </Text>
          </View>

          <View className="rounded-3xl border border-white/10 bg-[#0b1120ee] p-5">
            {error && (
              <View className="mb-4 rounded-2xl bg-[#ef444422] p-4">
                <Text className="text-[15px] text-[#fca5a5]">{error}</Text>
              </View>
            )}

            <View className="mb-2 flex-row items-center gap-2">
              <Server size={14} color="#93c5fd" />
              <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
                API URL
              </Text>
            </View>
            <TextInput
              className="mb-5 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="https://api.example.com"
              placeholderTextColor="#7f8ba8"
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isLoading}
            />

            <View className="mb-2 flex-row items-center gap-2">
              <Wifi size={14} color="#93c5fd" />
              <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
                WebSocket URL (optional)
              </Text>
            </View>
            <TextInput
              className="mb-7 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="Leave blank to reuse API URL"
              placeholderTextColor="#7f8ba8"
              value={wsUrl}
              onChangeText={setWsUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!isLoading}
            />

            <NativePressable
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#22c55e] py-4"
              onPress={handleSave}
              disabled={isLoading || !apiUrl.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-[17px] font-semibold text-white">
                    Connect
                  </Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </NativePressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
