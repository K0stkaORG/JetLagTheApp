import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ScrollView, View } from "react-native";

import AsyncButton from "../ui/AsyncButton";
import { T } from "../ui/text";
import { useGame } from "~/context/game";
import { useServer } from "~/services/server";

const CreateNewGame = () => {
    const { joinGame } = useGame();

    const handleResetServerDB = () =>
        useServer("/debug/reset-database", {
            method: "POST",
        });

    return (
        <ScrollView>
            <View className="flex gap-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Vytvořit novou hru</CardTitle>
                        <CardDescription>CreateNew.description</CardDescription>
                    </CardHeader>
                    <CardContent></CardContent>
                    <CardFooter className="flex justify-end">
                        <AsyncButton onPress={() => joinGame(999)}>
                            <T>Vytvořit hru</T>
                        </AsyncButton>
                    </CardFooter>
                </Card>

                <AsyncButton onPress={handleResetServerDB}>
                    <T>Reset server DB</T>
                </AsyncButton>
            </View>
        </ScrollView>
    );
};

export default CreateNewGame;
