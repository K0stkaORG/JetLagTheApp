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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function ServerUrlScreen() {
	const [url, setUrl] = useState("");
	const [isChecking, setIsChecking] = useState(false);
	const { setServerUrl, error, clearError } = useAuth();

	const handleSave = async () => {
		clearError();
		setIsChecking(true);
		await setServerUrl(url.trim());
		setIsChecking(false);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={styles.container}>
				<Text style={styles.title}>JetLag</Text>
				<Text style={styles.subtitle}>Enter your server URL</Text>

				<TextInput
					style={styles.input}
					placeholder="https://your-server.com"
					value={url}
					onChangeText={setUrl}
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="url"
					autoComplete="url"
					textContentType="URL"
				/>

				{error && <Text style={styles.error}>{error}</Text>}

				{isChecking ? (
					<ActivityIndicator size="large" />
				) : (
					<Button
						title="Connect"
						onPress={handleSave}
						disabled={!url.trim()}
					/>
				)}
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
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
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
});
