import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ScreenContainer";

MapLibreGL.setAccessToken(null);

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function MapScreen() {
  const [followUser, setFollowUser] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setLocationPermission(granted);

      if (granted) {
        MapLibreGL.locationManager.start();
      }
    })();

    return () => {
      MapLibreGL.locationManager.stop();
    };
  }, []);

  if (locationPermission === null) {
    return (
      <ScreenContainer className="items-center justify-center bg-[#020617]">
        <Text className="text-white">Requesting location permission...</Text>
      </ScreenContainer>
    );
  }

  if (locationPermission === false) {
    return (
      <ScreenContainer className="items-center justify-center bg-[#020617] px-4">
        <Text className="text-center text-white">
          Location permission is required to use the map.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-[#020617]">
      <MapLibreGL.MapView
        style={{ flex: 1 }}
        mapStyle={OPENFREEMAP_STYLE}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          followUserLocation={followUser}
          followZoomLevel={15}
          animationMode="flyTo"
          animationDuration={500}
        />
        <MapLibreGL.UserLocation visible={true} />
      </MapLibreGL.MapView>

      <View className="absolute left-4 right-4 top-16 rounded-2xl border border-white/10 bg-[#0b1222dd] px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-[14px] text-[#93c5fd]">⌖</Text>
          <Text className="text-[15px] font-semibold text-white">Live Map</Text>
        </View>
        <Text className="mt-1 text-[13px] text-white/70">
          {followUser ? "Following your location" : "Free explore mode"}
        </Text>
      </View>

      <Pressable
        onPress={() => setFollowUser((prev) => !prev)}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#6366f1] shadow-lg"
      >
        <Text className="text-[20px] text-white">{followUser ? "◎" : "◌"}</Text>
      </Pressable>
    </View>
  );
}
