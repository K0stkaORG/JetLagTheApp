import { StyleSheet, View } from "react-native";
import { useAuth, useUser } from "~/context/auth";
import { useEffect, useState } from "react";

import { Asset } from "expo-asset";
import AsyncButton from "~/components/AsyncButton";
import { T } from "~/components/ui/text";
import { WebView } from "react-native-webview";

export default function Screen() {
    const user = useUser();
    const { logout } = useAuth();
    const [htmlContent, setHtmlContent] = useState<string>("");

    useEffect(() => {
        async function loadHtml() {
            try {
                const asset = Asset.fromModule(require("../components/map.html"));
                await asset.downloadAsync();
                const response = await fetch(asset.uri);
                const html = await response.text();
                setHtmlContent(html);
            } catch (error) {
                console.error("Error loading map HTML:", error);
            }
        }
        loadHtml();
    }, []);

    return (
        <View style={styles.container}>
            <T>Welcome to the App! {user.nickname}</T>

            <View style={styles.mapContainer}>
                <WebView
                    source={{ html: htmlContent }}
                    style={styles.map}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            </View>

            <AsyncButton onPress={logout}>
                <T>Logout</T>
            </AsyncButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    mapContainer: {
        height: 300,
        marginVertical: 16,
        borderRadius: 8,
        overflow: "hidden",
    },
    map: {
        flex: 1,
    },
});
