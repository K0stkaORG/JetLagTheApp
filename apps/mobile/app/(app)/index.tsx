import { Link } from "expo-router";
import { Text, View } from "react-native";
import { ExampleDialog } from "../../components/ExampleDialog";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">JetLag: The App (New)</Text>
      <Link href="/(app)/map" className="mt-4 text-primary">
        Open Map
      </Link>
      <View className="mt-6">
        <ExampleDialog />
      </View>
    </View>
  );
}

