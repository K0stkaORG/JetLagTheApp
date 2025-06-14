import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Code, H1 } from "~/components/ui/typography";
import { useAuth, useUser } from "~/context/auth";

import AsyncButton from "~/components/ui/AsyncButton";
import { LogOut } from "~/lib/icons/LogOut";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { useGame } from "~/context/game";

export default function Screen() {
    const user = useUser();
    const { logout, refresh } = useAuth();

    const { gameId, team, state, debugChangeTeam, leaveGame } = useGame();

    return (
        <View className="relative flex h-full gap-5 p-5">
            <H1 className="text-center">Nastavení</H1>
            <Card>
                <CardHeader>
                    <CardTitle>Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <Code>{JSON.stringify(user, null, 2)}</Code>
                </CardContent>
                <CardFooter className="flex flex-row justify-between">
                    <AsyncButton onPress={refresh} variant="outline">
                        <T>Obnovit data</T>
                    </AsyncButton>

                    <AsyncButton
                        onPress={logout}
                        variant="destructive"
                        className="flex flex-row items-center justify-center gap-2">
                        <LogOut className="color-white" />
                        <T>Odhlásit se</T>
                    </AsyncButton>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Game</CardTitle>
                </CardHeader>
                <CardContent>
                    <Code>{JSON.stringify({ gameId, team, state }, null, 2)}</Code>
                </CardContent>
                <CardFooter className="flex flex-row justify-between">
                    <AsyncButton
                        onPress={() => debugChangeTeam(team === "seekers" ? "hiders" : "seekers")}
                        variant="outline">
                        <T>Změnit tým</T>
                    </AsyncButton>

                    <AsyncButton onPress={leaveGame} variant="destructive">
                        <T>Opustit hru</T>
                    </AsyncButton>
                </CardFooter>
            </Card>
        </View>
    );
}
