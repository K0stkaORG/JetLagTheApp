import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, clearServerUrl, error, clearError } = useAuth();

  const isFormValid =
    mode === "login"
      ? nickname.length > 0 && password.length > 0
      : nickname.length >= 3 && password.length >= 8;

  const handleSubmit = async () => {
    clearError();
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(nickname, password);
      } else {
        await register(nickname, password);
      }
    } catch {
      // Error is already set in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToServer = async () => {
    await clearServerUrl();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>JetLag</Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "login" && styles.tabActive]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[styles.tabText, mode === "login" && styles.tabTextActive]}
            >
              Login
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => setMode("register")}
          >
            <Text
              style={[
                styles.tabText,
                mode === "register" && styles.tabTextActive,
              ]}
            >
              Register
            </Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nickname"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === "login" ? "password" : "new-password"}
          textContentType={mode === "login" ? "password" : "newPassword"}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button
            title={mode === "login" ? "Login" : "Register"}
            onPress={handleSubmit}
            disabled={!isFormValid}
          />
        )}

        <View style={styles.footer}>
          <Button
            title="Change Server"
            onPress={handleBackToServer}
            color="#888"
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  tabActive: {
    backgroundColor: "#208AEF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  tabTextActive: {
    color: "#fff",
  },
  input: {
    width: "100%",
    maxWidth: 400,
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
    color: "#ff4444",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    marginTop: 16,
  },
});
