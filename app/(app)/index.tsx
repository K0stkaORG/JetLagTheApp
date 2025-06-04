import { useAuth, useUser } from "~/context/auth";

import AsyncButton from "~/components/AsyncButton";
import { T } from "~/components/ui/text";
import { View } from "react-native";

export default function Screen() {
    const user = useUser();

    const { logout } = useAuth();

    return (
        <View>
            <T>Welcome to the App! {user.nickname}</T>

            <AsyncButton onPress={logout}>
                <T>Logout</T>
            </AsyncButton>
        </View>
    );
}
