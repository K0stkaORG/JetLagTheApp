import { Redirect, Tabs } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MapPin } from "~/lib/icons/MapPin";
import React from "react";
import { ScrollText } from "~/lib/icons/ScrollText";
import SelectGameScreen from "~/components/game/SelectGameScreen";
import { Settings } from "~/lib/icons/Settings";
import { WalletCards } from "~/lib/icons/WalletCards";
import { useAuth } from "~/context/auth";
import { useColorScheme } from "~/lib/useColorScheme";
import { useGameContext } from "~/context/game";

export default function AppLayout() {
    const { isDarkColorScheme } = useColorScheme();
    const { isAuthenticated } = useAuth();
    const gameContext = useGameContext();

    if (!isAuthenticated) return <Redirect href="/login" />;

    if (!gameContext.gameId) return <SelectGameScreen />;

    return (
        <SafeAreaView className="flex-1">
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
                        title: "Map",
                        tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="logbook"
                    options={{
                        title: "Logbook",
                        tabBarIcon: ({ color }) => <ScrollText size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="hand"
                    options={{
                        title: "Hand",
                        tabBarIcon: ({ color }) => <WalletCards size={24} color={color} />,
                        href: gameContext.team === "hiders" ? "/hand" : null,
                    }}
                />

                <Tabs.Screen
                    name="questions"
                    options={{
                        title: "Questions",
                        tabBarIcon: ({ color }) => <WalletCards size={24} color={color} />,
                        href: gameContext.team === "seekers" ? "/questions" : null,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Settings",
                        tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
