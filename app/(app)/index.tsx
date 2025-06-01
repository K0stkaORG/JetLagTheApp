import { T } from "~/components/ui/text";
import { View } from "react-native";
import { useUser } from "~/context/auth";

export default function Screen() {
    const user = useUser();

    return (
        <View>
            <T>Welcome to the App! {user.nickname}</T>
        </View>
    );
}
