import { Redirect, Tabs } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import { ScrollText } from "~/lib/icons/ScrollText";
import { Settings } from "~/lib/icons/Settings";
import { MapPin } from "~/lib/icons/MapPin";
import { useAuth } from "~/context/auth";
import { WalletCards } from "~/lib/icons/WalletCards";

export default function AppLayout() {
    const { isDarkColorScheme } = useColorScheme();
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return (
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
                    tabBarIcon: ({ color }) => <MapPin size={24} className={color} />,
                }}
            />
            <Tabs.Screen
                name="logbook"
                options={{
                    title: "Logbook",
                    tabBarIcon: ({ color }) => <ScrollText size={24} className={color} />,
                }}
            />
            <Tabs.Screen
                name="hand"
                options={{
                    title: "Hand",
                    tabBarIcon: ({ color }) => <WalletCards size={24} className={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => <Settings size={24} className={color} />,
                }}
            />
        </Tabs>
    );
}
