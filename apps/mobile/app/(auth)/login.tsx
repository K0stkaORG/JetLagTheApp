import React, { useState, useRef } from "react";
import { TextInput } from "react-native";

import AsyncButton from "~/components/ui/AsyncButton";
import { Button } from "~/components/ui/button";
import { H1 } from "~/components/ui/typography";
import { Input } from "~/components/ui/input";
import { T } from "~/components/ui/text";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { useAuth } from "~/context/auth";

const Screen = () => {
    const { login } = useAuth();
    const passwordInputRef = useRef<TextInput | null>(null);

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        if (!nickname || !password) {
            toast.error("Prosím vyplňte všechna pole.");
            return;
        }

        await login({ nickname, password });
    };

    //TODO remove this later, creating dev account with these credentials is needed
    const handleDevLogin = async () => {
        await login({ nickname: "dev", password: "Dev12345" });
    };

    return (
        <>
            <H1 className="mb-5 color-jetlag-gray">Přihlásit se</H1>
            <Input
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                placeholder="Přezdívka"
                className="w-3/4 border-2 border-jetlag-gray bg-transparent color-jetlag-gray"
                returnKeyType="next"
                onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                }}
            />
            <Input
                ref={passwordInputRef as React.RefObject<TextInput>}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                placeholder="Heslo"
                className="w-3/4 border-2 border-jetlag-gray bg-transparent color-jetlag-gray"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
            />
            <AsyncButton onPress={handleLogin} className="mt-5 w-3/4 bg-jetlag-yellow font-bold">
                <T className="color-jetlag-blue">Přihlásit se</T>
            </AsyncButton>
            {/* TODO remove this later */}
            <AsyncButton onPress={handleDevLogin} className="mt-5 w-3/4 bg-jetlag-yellow font-bold">
                <T className="color-jetlag-blue">Devlogin</T>
            </AsyncButton>
            <Button
                variant="ghost"
                className="mb-5 mt-auto"
                onPress={() => router.replace("/register")}>
                <T className="color-jetlag-gray">Vytvořit účet</T>
            </Button>
        </>
    );
};

export default Screen;
