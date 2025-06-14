import * as FileSystem from "expo-file-system";

import { Alert, View } from "react-native";
import React, { useEffect, useState } from "react";

import { Asset } from "expo-asset";
import { LeafletView } from "react-native-leaflet-view";
import Spinner from "../ui/Spinner";
import { toast } from "sonner-native";

const DEFAULT_LOCATION = {
    latitude: 49.5939614,
    longitude: 17.2509367,
};

interface MapProps {
    center?: {
        latitude: number;
        longitude: number;
    };
}

export const Map: React.FC<MapProps> = ({ center = DEFAULT_LOCATION }) => {
    const [webViewContent, setWebViewContent] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadHtml = async () => {
            try {
                const path = require("~/assets/leaflet.html");
                const asset = Asset.fromModule(path);
                await asset.downloadAsync();
                const htmlContent = await FileSystem.readAsStringAsync(asset.localUri!);

                if (isMounted) {
                    setWebViewContent(htmlContent);
                }
            } catch (error) {
                toast.error("Při načítání mapy došlo k chybě.", {
                    description: JSON.stringify(error),
                });
            }
        };

        loadHtml();

        return () => {
            isMounted = false;
        };
    }, []);

    if (!webViewContent) {
        return (
            <View className="flex h-full items-center justify-center">
                <Spinner fullscreen />
            </View>
        );
    }

    return (
        <View className="flex h-full items-center justify-center">
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

export default Map;
