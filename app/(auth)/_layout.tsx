import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Redirect, Slot } from "expo-router";

import Logo from "~/assets/Logo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/context/auth";

const Layout = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) return <Redirect href="/" />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <SafeAreaView className="bg-jetlag-blue">
                <View className="h-screen-safe flex w-screen items-center justify-start gap-5 pt-5">
                    <Logo className="h-72 w-72" />
                    <Slot />
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default Layout;
