import { Link, router } from "expo-router";

import AsyncButton from "~/components/AsyncButton";
import { Button } from "~/components/ui/button";
import { H1 } from "~/components/ui/typography";
import { Input } from "~/components/ui/input";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { toast } from "sonner-native";
import { useAuth } from "~/context/auth";
import { useState } from "react";

const Screen = () => {
    const { login } = useAuth();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        if (!nickname || !password) {
            toast.error("Prosím vyplňte všechna pole.");
            return;
        }

        await login({ nickname, password });
    };

    return (
        <>
            <H1 className="mb-5">Přihlásit se</H1>
            <Input
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                placeholder="Přezdívka"
                className="w-3/4 border-2 border-jetlag-gray bg-transparent color-jetlag-gray"
            />
            <Input
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                placeholder="Heslo"
                className="w-3/4 border-2 border-jetlag-gray bg-transparent color-jetlag-gray"
            />
            <AsyncButton
                onPress={handleLogin}
                className="mt-5 w-3/4 bg-jetlag-yellow font-bold color-jetlag-blue">
                <T>Přihlásit se</T>
            </AsyncButton>
            <Button
                variant="ghost"
                className="mb-5 mt-auto"
                onPress={() => router.replace("/register")}>
                <T>Vytvořit účet</T>
            </Button>
        </>
    );
};

export default Screen;
