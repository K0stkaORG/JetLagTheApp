import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function ServerUrlScreen() {
	const [url, setUrl] = useState("");
	const [isChecking, setIsChecking] = useState(false);
	const { setServerUrl, error, clearError } = useAuth();
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const handleSave = async () => {
		clearError();
		setIsChecking(true);
		await setServerUrl(url.trim());
		setIsChecking(false);
	};

	return (
		<AuthScreen
			title="Connect to server"
			subtitle="Enter your JetLag server address."
			primaryTitle="Continue"
			onPrimary={handleSave}
			primaryDisabled={!url.trim()}
			isLoading={isChecking}
			error={error}>
			<View style={styles.field}>
				<Text style={styles.label}>Server URL</Text>
				<TextInput
					style={styles.input}
					placeholder="https://your-server.com"
					placeholderTextColor={theme.textSecondary}
					value={url}
					onChangeText={setUrl}
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="url"
					autoComplete="url"
					textContentType="URL"
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
