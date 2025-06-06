import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View, NativeSyntheticEvent } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { LeafletView } from "react-native-leaflet-view";

const DEFAULT_LOCATION = {
    latitude: 49.5939614,
    longitude: 17.2509367,
};

interface MapProps {
    center?: {
        latitude: number;
        longitude: number;
    };
    style?: any;
}

export const Map: React.FC<MapProps> = ({ center = DEFAULT_LOCATION, style }) => {
    const [webViewContent, setWebViewContent] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadHtml = async () => {
            try {
                const path = require("../assets/leaflet.html");
                const asset = Asset.fromModule(path);
                await asset.downloadAsync();
                const htmlContent = await FileSystem.readAsStringAsync(asset.localUri!);

                if (isMounted) {
                    setWebViewContent(htmlContent);
                }
            } catch (error) {
                Alert.alert("Error loading HTML", JSON.stringify(error));
                console.error("Error loading HTML:", error);
            }
        };

        loadHtml();

        return () => {
            isMounted = false;
        };
    }, []);

    if (!webViewContent) {
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <LeafletView
                source={{ html: webViewContent }}
                mapCenterPosition={{
                    lat: center.latitude,
                    lng: center.longitude,
                }}
                zoom={11}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 8,
        overflow: "hidden",
    },
    map: {
        flex: 1,
    },
});

export default Map;
