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
import { LoginRequest } from "@jetlag/shared-types";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";
import { ArrowRight, ShieldCheck } from "lucide-react-native";

export default function LoginScreen() {
  const { login, authError, isAuthenticated } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (isAuthenticated) {
    router.replace("/(app)/lobby");
    return null;
  }

  const handleLogin = async () => {
    setValidationError(null);
    const parsed = LoginRequest.safeParse({ nickname, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0].message);
      return;
    }
    setIsLoading(true);
    try {
      await login(nickname, password);
      router.replace("/(app)/lobby");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-[#050816]">
      <View className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#4f46e533]" />
      <View className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-[#06b6d433]" />
      <View className="absolute bottom-8 left-8 h-40 w-40 rounded-full bg-[#f43f5e22]" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
          <View className="mb-10 items-center">
            <View className="mb-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2">
              <Text className="text-[13px] font-semibold tracking-[2px] text-white/90">
                JETLAG
              </Text>
            </View>
            <Text className="text-center text-[34px] font-black text-white">
              Welcome back
            </Text>
            <Text className="mt-2 text-center text-[15px] text-white/70">
              Continue your journey and join live games.
            </Text>
          </View>

          <View className="rounded-3xl border border-white/10 bg-[#0d1324ee] p-5">
            {(authError || validationError) && (
              <View className="mb-4 rounded-2xl bg-[#ef444422] p-4">
                <Text className="text-[15px] text-[#fca5a5]">
                  {authError || validationError}
                </Text>
              </View>
            )}

            <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
              Nickname
            </Text>
            <TextInput
              className="mb-5 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="Your nickname"
              placeholderTextColor="#7f8ba8"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              editable={!isLoading}
            />

            <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
              Password
            </Text>
            <TextInput
              className="mb-7 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="Password"
              placeholderTextColor="#7f8ba8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />

            <NativePressable
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#6366f1] py-4"
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-[17px] font-semibold text-white">
                    Sign in
                  </Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </NativePressable>

            <View className="mt-4 flex-row items-center justify-center gap-2">
              <ShieldCheck size={14} color="#93c5fd" />
              <Text className="text-[13px] text-[#93c5fd]">
                Secure socket authentication enabled
              </Text>
            </View>
          </View>

          <NativePressable
            className="mt-6 py-3 items-center"
            onPress={() => router.push("/(auth)/register")}
            disabled={isLoading}
            haptic={false}
          >
            <Text className="text-[16px] text-white/80">
              Don’t have an account?{" "}
              <Text className="font-semibold text-white">Create one</Text>
            </Text>
          </NativePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
