import { Link } from "expo-router";
import { T } from "~/components/ui/text";
import { View } from "react-native";

export default function NotFoundScreen() {
    return (
        <View>
            <T>This screen doesn't exist.</T>

            <Link href="/">
                <T>Go to home screen!</T>
            </Link>
        </View>
    );
}
