import { Camera, FillLayer, Logger, MapView, ShapeSource } from "@maplibre/maplibre-react-native";
import { cordsToMap, createGeoJSONCircle } from "~/lib/map";

import { Coordinates } from "~/types/models";

interface MapProps {
    center: Coordinates;
    zoom: number;
    radiusInMeters?: number;
}

Logger.setLogCallback((log) => log.tag === "Mbgl-HttpRequest");

const Map = ({ center, zoom, radiusInMeters = 1000 }: MapProps) => {
    // requestAndroidLocationPermissions();

    return (
        <MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            attributionEnabled={false}
            mapStyle="https://tiles.openfreemap.org/styles/liberty">
            {/* <UserLocation androidRenderMode="compass" /> */}
            <Camera zoomLevel={zoom} centerCoordinate={cordsToMap(center)} />
            <ShapeSource id="circleSource" shape={createGeoJSONCircle(center, radiusInMeters)}>
                <FillLayer
                    id="circleLayer"
                    style={{
                        fillAntialias: true,
                        fillColor: "blue",
                        fillOpacity: 0.5,
                    }}
                />
            </ShapeSource>
        </MapView>
    );
};

export default Map;
