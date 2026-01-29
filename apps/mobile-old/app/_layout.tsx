import "~/global.css";

import * as React from "react";

import { Appearance, Platform } from "react-native";
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from "@react-navigation/native";

import { AuthProvider } from "~/context/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NAV_THEME } from "~/lib/constants";
import { PortalHost } from "@rn-primitives/portal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Toaster } from "sonner-native";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { useColorScheme } from "~/lib/useColorScheme";

const LIGHT_THEME: Theme = {
    ...DefaultTheme,
    colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
    ...DarkTheme,
    colors: NAV_THEME.dark,
};

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from "expo-router";

const usePlatformSpecificSetup = Platform.select({
    web: useSetWebBackgroundClassName,
    android: useSetAndroidNavigationBar,
    default: noop,
});

export default function RootLayout() {
    usePlatformSpecificSetup();
    const { isDarkColorScheme } = useColorScheme();

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView>
                <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
                    <AuthProvider>
                        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
                        <Stack
                            screenOptions={{
                                headerShown: false,
                            }}
                        />
                    </AuthProvider>
                    <PortalHost />
                    <Toaster richColors />
                </ThemeProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

const useIsomorphicLayoutEffect =
    Platform.OS === "web" && typeof window === "undefined"
        ? React.useEffect
        : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
    useIsomorphicLayoutEffect(() => {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
    }, []);
}

function useSetAndroidNavigationBar() {
    React.useLayoutEffect(() => {
        setAndroidNavigationBar(Appearance.getColorScheme() ?? "light");
    }, []);
}

function noop() {}
