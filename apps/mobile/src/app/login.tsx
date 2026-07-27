import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
	const [mode, setMode] = useState<"login" | "register">("login");
	const [nickname, setNickname] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login, register, clearServerUrl, error, clearError } = useAuth();
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const isFormValid =
		mode === "login" ? nickname.length > 0 && password.length > 0 : nickname.length >= 3 && password.length >= 8;

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

	const handleBack = async () => {
		await clearServerUrl();
	};

	const toggleMode = () => setMode(mode === "login" ? "register" : "login");

	return (
		<AuthScreen
			title={mode === "login" ? "Login" : "Create account"}
			subtitle={mode === "login" ? "Enter your credentials to continue." : "Sign up to start playing."}
			primaryTitle="Continue"
			onPrimary={handleSubmit}
			primaryDisabled={!isFormValid}
			isLoading={isLoading}
			onBack={handleBack}
			secondaryLabel={mode === "login" ? "Create an account" : "Already have an account?"}
			onSecondary={toggleMode}
			error={error}>
			<View style={styles.field}>
				<Text style={styles.label}>Nickname</Text>
				<TextInput
					style={styles.input}
					placeholder="Your nickname"
					placeholderTextColor={theme.textSecondary}
					value={nickname}
					onChangeText={setNickname}
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="username"
					textContentType="username"
				/>
			</View>

			<View style={styles.field}>
				<Text style={styles.label}>Password</Text>
				<TextInput
					style={styles.input}
					placeholder="Your password"
					placeholderTextColor={theme.textSecondary}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoComplete={mode === "login" ? "password" : "new-password"}
					textContentType={mode === "login" ? "password" : "newPassword"}
				/>
			</View>
		</AuthScreen>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
	StyleSheet.create({
		field: {
			gap: 6,
		},
		label: {
			fontSize: 14,
			fontWeight: "600",
			color: theme.text,
		},
		input: {
			height: 48,
			borderWidth: 1,
			borderColor: theme.border,
			borderRadius: 12,
			paddingHorizontal: 12,
			fontSize: 16,
			color: theme.text,
			backgroundColor: theme.inputBackground,
		},
	});
