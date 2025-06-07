import AsyncButton from "~/components/AsyncButton";
import { Button } from "~/components/ui/button";
import { H1 } from "~/components/ui/typography";
import { Input } from "~/components/ui/input";
import { T } from "~/components/ui/text";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { useAuth } from "~/context/auth";
import { useState } from "react";

const Screen = () => {
    const { register } = useAuth();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleRegistration = async () => {
        if (!nickname || !password) {
            toast.error("Prosím vyplňte všechna pole.");
            return;
        }

        await register({ nickname, password });
    };

    return (
        <>
            <H1 className="mb-5">Vytvořit účet</H1>
            <Input
                value={nickname}
                onChangeText={setNickname}
                placeholder="Přezdívka"
                className="border-jetlag-gray color-jetlag-gray w-3/4 border-2 bg-transparent"
            />
            <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Heslo"
                className="border-jetlag-gray color-jetlag-gray w-3/4 border-2 bg-transparent"
            />
            <AsyncButton
                onPress={handleRegistration}
                className="bg-jetlag-yellow color-jetlag-blue mt-5 w-3/4 font-bold">
                <T>Vytvořit účet</T>
            </AsyncButton>
            <Button
                variant="ghost"
                className="mb-5 mt-auto"
                onPress={() => router.replace("/login")}>
                <T>Přihlásit se</T>
            </Button>
        </>
    );
};

export default Screen;
