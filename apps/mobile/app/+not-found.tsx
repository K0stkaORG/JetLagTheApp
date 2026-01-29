import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">Screen not found</Text>
      <Link href="/(app)" className="mt-4 text-primary">
        Go to Home
      </Link>
    </View>
  );
}

