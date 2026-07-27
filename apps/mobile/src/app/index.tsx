import { useTheme } from "@/hooks/use-theme";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<ActivityIndicator
				size="large"
				color={theme.text}
			/>
		</View>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
	StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: theme.background,
		},
	});
