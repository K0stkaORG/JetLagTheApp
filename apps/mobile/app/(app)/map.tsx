import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { Navigation, NavigationOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

MapLibreGL.setAccessToken(null);

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function MapScreen() {
  const [followUser, setFollowUser] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

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
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Requesting location permission...</Text>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Text className="text-center text-foreground">
          Location permission is required to use the map.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
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

      <Pressable
        onPress={() => setFollowUser((prev) => !prev)}
        className="absolute bottom-6 right-4 h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        {followUser ? (
          <Navigation size={24} color="white" />
        ) : (
          <NavigationOff size={24} color="white" />
        )}
      </Pressable>
    </View>
  );
}

