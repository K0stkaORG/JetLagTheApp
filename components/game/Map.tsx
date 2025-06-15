import {
    Camera,
    FillLayer,
    Logger,
    MapView,
    ShapeSource,
    UserLocation,
    requestAndroidLocationPermissions,
} from "@maplibre/maplibre-react-native";
import { cordsToMap, createGeoJSONCircle } from "~/lib/map";

interface MapProps {
    center: [number, number];
    zoom: number;
    radiusInMeters?: number;
}

Logger.setLogCallback((log) => log.tag === "Mbgl-HttpRequest");

const Map = ({ center, zoom, radiusInMeters = 1000 }: MapProps) => {
    requestAndroidLocationPermissions();
    return (
        // Reverted to MapView as the root for map-related elements
        <MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            attributionEnabled={false}
            mapStyle="https://tiles.openfreemap.org/styles/liberty">
            <UserLocation androidRenderMode="compass" />
            <Camera zoomLevel={zoom} centerCoordinate={cordsToMap(center)} />
            <ShapeSource
                id="circleSource"
                shape={createGeoJSONCircle(cordsToMap(center), radiusInMeters)}>
                <FillLayer
                    id="circleLayer"
                    style={{
                        fillAntialias: true,
                        fillColor: "blue",
                        fillOpacity: 0.5,
                    }}
                    belowLayerID="building" // Corrected property name
                />
            </ShapeSource>
            {/* Removed the absolute positioned View overlay */}
        </MapView>
    );
};

export default Map;
