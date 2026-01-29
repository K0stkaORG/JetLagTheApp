import * as Linking from "expo-linking";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

import AsyncButton from "~/components/ui/AsyncButton";
import { H1 } from "~/components/ui/typography";
import { LogOut } from "~/lib/icons/LogOut";
import { ScrollView } from "react-native-gesture-handler";
import { T } from "~/components/ui/text";
import { useAuth } from "~/context/auth";
import { useGame } from "~/context/game";

export default function Screen() {
    const { logout, refresh } = useAuth();

    const { pause, resume, leaveGame } = useGame();

    return (
        <ScrollView className="relative p-5" contentContainerClassName="gap-5">
            <H1 className="text-center">Nastavení</H1>
            <Card>
                <CardHeader>
                    <CardTitle>Session</CardTitle>
                </CardHeader>
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
                <CardFooter className="flex flex-row justify-between">
                    <AsyncButton onPress={pause} variant="outline">
                        <T>Pause</T>
                    </AsyncButton>
                    <AsyncButton onPress={resume} variant="outline">
                        <T>Resume</T>
                    </AsyncButton>
                    <AsyncButton onPress={leaveGame} variant="destructive">
                        <T>Opustit hru</T>
                    </AsyncButton>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Attributions</CardTitle>
                </CardHeader>
                <CardContent>
                    <T>
                        Map:{" "}
                        <T
                            onPress={() => Linking.openURL("https://openfreemap.org/")}
                            style={{ fontWeight: "bold", textDecorationLine: "underline" }}>
                            OpenFreeMap
                        </T>
                    </T>
                    <T>
                        Tiles:{" "}
                        <T
                            onPress={() => Linking.openURL("https://www.openmaptiles.org/")}
                            style={{ fontWeight: "bold", textDecorationLine: "underline" }}>
                            OpenMapTiles
                        </T>
                    </T>
                    <T>
                        Data from:{" "}
                        <T
                            onPress={() => Linking.openURL("https://openstreetmap.org/")}
                            style={{ fontWeight: "bold", textDecorationLine: "underline" }}>
                            OpenStreetMap
                        </T>
                    </T>
                </CardContent>
            </Card>
        </ScrollView>
    );
}
