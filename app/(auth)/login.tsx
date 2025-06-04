import AsyncButton from "~/components/AsyncButton";
import { Input } from "~/components/ui/input";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "~/context/auth";
import { useState } from "react";

const Screen = () => {
    const { login } = useAuth();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        if (!nickname || !password) {
            alert("Please enter both nickname and password.");
            return;
        }

        await login({ nickname, password })
            .then(() => {
                router.replace("/");
            })
            .catch((error) => {
                alert(error.message);
            });
    };

    return (
        <View className="h-screen-safe flex items-center justify-center gap-3">
            <Input value={nickname} onChangeText={setNickname} placeholder="Nickname" />
            <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
            />
            <AsyncButton onPress={handleLogin}>
                <T>Login</T>
            </AsyncButton>
        </View>
    );
};

export default Screen;
