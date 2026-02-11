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
    <ScreenContainer className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="text-foreground text-[28px] font-bold mb-2">Create account</Text>
          <Text className="text-muted-foreground text-[15px] mb-8">
            Choose a nickname and password
          </Text>

          {success && (
            <View className="mb-4 p-4 rounded-xl bg-green-500/15">
              <Text className="text-green-600 dark:text-green-400 text-[15px]">
                Account created. Taking you to sign in…
              </Text>
            </View>
          )}

          {(authError || validationError) && (
            <View className="mb-4 p-4 rounded-xl bg-destructive/15">
              <Text className="text-destructive text-[15px]">{authError || validationError}</Text>
            </View>
          )}

          <Text className="text-foreground text-[13px] font-semibold mb-2 uppercase tracking-wide opacity-70">
            Nickname (3–30 characters)
          </Text>
          <TextInput
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-[17px] mb-5"
            placeholder="Your nickname"
            placeholderTextColor="#8e8e93"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            autoComplete="username"
            editable={!isLoading}
          />

          <Text className="text-foreground text-[13px] font-semibold mb-2 uppercase tracking-wide opacity-70">
            Password (8+ chars, upper, lower, number)
          </Text>
          <TextInput
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-[17px] mb-5"
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!isLoading}
          />

          <Text className="text-foreground text-[13px] font-semibold mb-2 uppercase tracking-wide opacity-70">
            Confirm password
          </Text>
          <TextInput
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-[17px] mb-8"
            placeholder="Confirm password"
            placeholderTextColor="#8e8e93"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />

          <NativePressable
            className="w-full py-4 rounded-xl bg-primary items-center justify-center"
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-[17px]">Create account</Text>
            )}
          </NativePressable>

          <NativePressable
            className="mt-6 py-3 items-center"
            onPress={() => router.replace("/(auth)/login")}
            disabled={isLoading}
            haptic={false}>
            <Text className="text-primary text-[16px]">
              Already have an account? <Text className="font-semibold">Sign in</Text>
            </Text>
          </NativePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
