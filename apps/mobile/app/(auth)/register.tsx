import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">Register</Text>
      <Link href="/(app)" className="mt-4 text-primary">
        Continue to app
      </Link>
    </View>
  );
}

