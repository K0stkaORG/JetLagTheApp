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
    const { register } = useAuth();
    const passwordInputRef = useRef<TextInput | null>(null);

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleRegistration = async () => {
        if (!nickname || !password) {
            toast.error("Prosím vyplňte všechna pole.");
            return;
        }

        await register({ nickname, password });
    };

    const handleDevRegister = async () => {
        await register({ nickname: "dev", password: "Dev12345" });
    };

    return (
        <>
            <H1 className="mb-5 color-jetlag-gray">Vytvořit účet</H1>
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
                onSubmitEditing={handleRegistration}
            />
            <AsyncButton
                onPress={handleRegistration}
                className="mt-5 w-3/4 bg-jetlag-yellow font-bold">
                <T className="color-jetlag-blue">Vytvořit účet</T>
            </AsyncButton>
            <AsyncButton
                onPress={handleDevRegister}
                className="mt-5 w-3/4 bg-jetlag-yellow font-bold">
                <T className="color-jetlag-blue">Devregister</T>
            </AsyncButton>
            <Button
                variant="ghost"
                className="mb-5 mt-auto"
                onPress={() => router.replace("/login")}>
                <T className="color-jetlag-gray">Přihlásit se</T>
            </Button>
        </>
    );
};

export default Screen;
