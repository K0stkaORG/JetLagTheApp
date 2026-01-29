import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">Login</Text>
      <Link href="/(app)" className="mt-4 text-primary">
        Continue to app
      </Link>
    </View>
  );
}

