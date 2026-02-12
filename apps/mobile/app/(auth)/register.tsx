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
import { RegisterRequest } from "@jetlag/shared-types";
import { ScreenContainer } from "@/components/ScreenContainer";
import { NativePressable } from "@/components/NativePressable";
import { ArrowRight } from "lucide-react-native";

export default function RegisterScreen() {
  const { register, authError } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setValidationError(null);
    setSuccess(false);
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    const parsed = RegisterRequest.safeParse({ nickname, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0].message);
      return;
    }
    setIsLoading(true);
    try {
      await register(nickname, password);
      setSuccess(true);
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-[#050816]">
      <View className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#6366f133]" />
      <View className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-[#14b8a633]" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8">
            <Text className="text-[34px] font-black text-white">
              Create account
            </Text>
            <Text className="mt-2 text-[15px] text-white/70">
              Set up your profile to join JetLag games.
            </Text>
          </View>

          <View className="rounded-3xl border border-white/10 bg-[#0d1324ee] p-5">
            {success && (
              <View className="mb-4 rounded-2xl bg-[#22c55e22] p-4">
                <Text className="text-[15px] text-[#86efac]">
                  Account created. Taking you to sign in…
                </Text>
              </View>
            )}

            {(authError || validationError) && (
              <View className="mb-4 rounded-2xl bg-[#ef444422] p-4">
                <Text className="text-[15px] text-[#fca5a5]">
                  {authError || validationError}
                </Text>
              </View>
            )}

            <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
              Nickname (3–30 chars)
            </Text>
            <TextInput
              className="mb-5 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="Your nickname"
              placeholderTextColor="#7f8ba8"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoComplete="username"
              editable={!isLoading}
            />

            <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
              Password
            </Text>
            <TextInput
              className="mb-5 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="8+ chars, upper, lower, number"
              placeholderTextColor="#7f8ba8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!isLoading}
            />

            <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-white/60">
              Confirm password
            </Text>
            <TextInput
              className="mb-7 w-full rounded-2xl border border-white/10 bg-[#111a2d] px-4 py-4 text-[17px] text-white"
              placeholder="Repeat your password"
              placeholderTextColor="#7f8ba8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <NativePressable
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#6366f1] py-4"
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-[17px] font-semibold text-white">
                    Create account
                  </Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </NativePressable>
          </View>

          <NativePressable
            className="mt-6 py-3 items-center"
            onPress={() => router.replace("/(auth)/login")}
            disabled={isLoading}
            haptic={false}
          >
            <Text className="text-[16px] text-white/80">
              Already have an account?{" "}
              <Text className="font-semibold text-white">Sign in</Text>
            </Text>
          </NativePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
