import { useTheme } from "@/hooks/use-theme";
import { ReactNode, useMemo } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBackground } from "./AuthBackground";
import { Logo } from "./Logo";

const LOGO_SIZE = 96;
const PURPLE = "#5B4DFF";

type AuthScreenProps = {
	title: string;
	subtitle: string;
	children: ReactNode;
	primaryTitle: string;
	onPrimary: () => void;
	primaryDisabled?: boolean;
	isLoading?: boolean;
	secondaryLabel?: string;
	onSecondary?: () => void;
	onBack?: () => void;
	error?: string | null;
};

export function AuthScreen({
	title,
	subtitle,
	children,
	primaryTitle,
	onPrimary,
	primaryDisabled,
	isLoading,
	secondaryLabel,
	onSecondary,
	onBack,
	error,
}: AuthScreenProps) {
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.root}>
			<AuthBackground />
			<KeyboardAvoidingView
				style={styles.keyboard}
				behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.container}>
						{onBack && (
							<Pressable
								onPress={onBack}
								style={styles.backButton}>
								<Text style={styles.backIcon}>←</Text>
								<Text style={styles.backText}>Back</Text>
							</Pressable>
						)}
						<ScrollView
							contentContainerStyle={styles.scrollContent}
							keyboardShouldPersistTaps="handled"
							bounces={false}>
							<View style={styles.content}>
								<View style={styles.card}>
									<View style={styles.logoWrapper}>
										<Logo size={LOGO_SIZE} />
									</View>
									<Text style={styles.title}>{title}</Text>
									<View style={styles.underline} />
									<Text style={styles.subtitle}>{subtitle}</Text>
									<View style={styles.form}>{children}</View>
									{error ? <Text style={styles.error}>{error}</Text> : null}
									<View style={styles.primaryRow}>
										{isLoading ? (
											<ActivityIndicator color={PURPLE} />
										) : (
											<Pressable
												onPress={onPrimary}
												disabled={primaryDisabled}
												style={[
													styles.primaryButton,
													primaryDisabled && styles.primaryButtonDisabled,
												]}>
												<Text style={styles.primaryText}>{primaryTitle}</Text>
												<Text style={styles.primaryIcon}>→</Text>
											</Pressable>
										)}
									</View>
								</View>
								{secondaryLabel ? (
									<Pressable
										onPress={onSecondary}
										style={styles.secondaryButton}>
										<Text style={styles.secondaryText}>{secondaryLabel}</Text>
									</Pressable>
								) : null}
							</View>
						</ScrollView>
					</View>
				</SafeAreaView>
			</KeyboardAvoidingView>
		</View>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
	StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: theme.background,
		},
		keyboard: {
			flex: 1,
		},
		safeArea: {
			flex: 1,
		},
		container: {
			flex: 1,
			padding: 24,
		},
		backButton: {
			alignSelf: "flex-start",
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			backgroundColor: theme.backgroundElement,
			paddingVertical: 6,
			paddingHorizontal: 12,
			borderRadius: 20,
			marginBottom: 16,
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
				},
				android: {
					elevation: 2,
				},
			}),
		},
		backIcon: {
			fontSize: 16,
			color: theme.text,
		},
		backText: {
			fontSize: 14,
			fontWeight: "600",
			color: theme.text,
		},
		scrollContent: {
			flexGrow: 1,
			justifyContent: "center",
		},
		content: {
			width: "100%",
			maxWidth: 420,
			alignSelf: "center",
		},
		card: {
			position: "relative",
			backgroundColor: theme.backgroundElement,
			borderRadius: 24,
			paddingHorizontal: 24,
			paddingBottom: 24,
			paddingTop: LOGO_SIZE / 2 + 20,
			...Platform.select({
				ios: {
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.08,
					shadowRadius: 12,
				},
				android: {
					elevation: 4,
				},
			}),
		},
		logoWrapper: {
			position: "absolute",
			top: -LOGO_SIZE / 2,
			alignSelf: "center",
		},
		title: {
			fontSize: 28,
			fontWeight: "700",
			color: theme.text,
		},
		underline: {
			width: 40,
			height: 4,
			borderRadius: 2,
			backgroundColor: "#FFBF40",
			marginTop: 8,
			marginBottom: 8,
		},
		subtitle: {
			fontSize: 14,
			color: theme.textSecondary,
			marginBottom: 24,
			lineHeight: 20,
		},
		form: {
			gap: 16,
		},
		error: {
			color: "#E53935",
			fontSize: 14,
			textAlign: "center",
			marginTop: 12,
		},
		primaryRow: {
			flexDirection: "row",
			justifyContent: "flex-end",
			marginTop: 20,
		},
		primaryButton: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			backgroundColor: PURPLE,
			paddingVertical: 12,
			paddingHorizontal: 20,
			borderRadius: 12,
		},
		primaryButtonDisabled: {
			opacity: 0.5,
		},
		primaryText: {
			color: "#FFFFFF",
			fontSize: 16,
			fontWeight: "700",
		},
		primaryIcon: {
			color: "#FFFFFF",
			fontSize: 16,
			fontWeight: "700",
		},
		secondaryButton: {
			alignSelf: "center",
			marginTop: 20,
			padding: 8,
		},
		secondaryText: {
			fontSize: 14,
			color: theme.textSecondary,
			textDecorationLine: "underline",
		},
	});
