import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Redirect, Tabs } from "expo-router";

import { Button } from "~/components/ui/button";
import { MapPin } from "~/lib/icons/MapPin";
import React from "react";
import { RefreshCw } from "~/lib/icons/RefreshCw";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollText } from "~/lib/icons/ScrollText";
import SelectGameScreen from "~/components/game/SelectGameScreen";
import { Settings } from "~/lib/icons/Settings";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { WalletCards } from "~/lib/icons/WalletCards";
import { WifiOff } from "~/lib/icons/WifiOff";
import { useAuth } from "~/context/auth";
import { useColorScheme } from "~/lib/useColorScheme";
import { useGameContext } from "~/context/game";

export default function GameLayout() {
    const { isDarkColorScheme } = useColorScheme();
    const { isAuthenticated } = useAuth();
    const gameContext = useGameContext();

    if (!isAuthenticated) return <Redirect href="/login" />;

    if (!gameContext.gameId) return <SelectGameScreen />;

    return (
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
            {!gameContext.isOnline && (
                <View className="top-safe-offset-5 left-safe-offset-5 right-safe-offset-5 absolute z-50">
                    <Alert icon={WifiOff} variant="default">
                        <AlertTitle>Jste offline</AlertTitle>
                        <AlertDescription>Některé informace mohou být zastaralé.</AlertDescription>
                        <Button
                            size="sm"
                            variant="default"
                            className="mt-4 flex flex-row items-center gap-2"
                            onPress={gameContext.reconnect}>
                            <RefreshCw className="h-4 color-white" />
                            <T>Zkusit znovu</T>
                        </Button>
                    </Alert>
                </View>
            )}
            <View className="flex flex-row items-center justify-center gap-1 bg-jetlag-blue p-2">
                <T className="color-jetlag-gray">{gameContext.state}</T>
                <T className="color-jetlag-gray">|</T>
                <T className="font-bold color-jetlag-gray">1:23:45</T>
            </View>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: isDarkColorScheme ? "#1a1a1a" : "#ffffff",
                    },
                    tabBarActiveTintColor: "#007AFF",
                    tabBarInactiveTintColor: isDarkColorScheme ? "#666666" : "#999999",
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Mapa",
                        tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="logbook"
                    options={{
                        title: "Záznam",
                        tabBarIcon: ({ color }) => <ScrollText size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="hand"
                    options={{
                        title: "Karty",
                        tabBarIcon: ({ color }) => <WalletCards size={24} color={color} />,
                        href: gameContext.team === "hiders" ? "/hand" : null,
                    }}
                />

                <Tabs.Screen
                    name="questions"
                    options={{
                        title: "Otázky",
                        tabBarIcon: ({ color }) => <WalletCards size={24} color={color} />,
                        href: gameContext.team === "seekers" ? "/questions" : null,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Nastavení",
                        tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
