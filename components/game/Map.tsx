import {
    Camera,
    FillLayer,
    Logger,
    MapView,
    MarkerView,
    PointAnnotation,
    ShapeSource,
    SymbolLayer,
    UserLocation,
} from "@maplibre/maplibre-react-native";
import { cordsToMap, createGeoJSONCircle } from "~/lib/map";
import { useEffect, useState } from "react";

import { Coordinates } from "~/types/models";
import { T } from "../ui/text";

interface MapProps {
    center: Coordinates;
    zoom: number;
    radiusInMeters?: number;
}

Logger.setLogCallback((log) => log.tag === "Mbgl-HttpRequest");

const Polygon = ({ coordinates }: { coordinates: Coordinates[] }) => {
    return (
        <ShapeSource
            id="polygonSource"
            shape={{
                type: "Polygon",
                coordinates: [[...coordinates.map(cordsToMap), cordsToMap(coordinates[0])]],
            }}>
            <FillLayer
                id="polygonLayer"
                style={{
                    fillColor: "blue",
                    fillOpacity: 0.5,
                }}
            />
        </ShapeSource>
    );
};

const Map = ({ center, zoom }: MapProps) => {
    const [poiCords, setPoiCoords] = useState<Coordinates>(center);

    useEffect(() => {
        const interval = setInterval(
            () =>
                setPoiCoords([
                    center[0] + 0.0001 * Math.sin(Date.now() / 1000),
                    center[1] + 0.0001 * Math.cos(Date.now() / 1000),
                ]),
            1000
        );

        return () => clearInterval(interval);
    }, []);

    // requestAndroidLocationPermissions();

    return (
        <MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            attributionEnabled={false}
            mapStyle="https://tiles.openfreemap.org/styles/liberty">
            {/* <UserLocation androidRenderMode="compass" /> */}
            <Camera
                maxBounds={{
                    ne: cordsToMap([center[0] + 0.05, center[1] + 0.05]),
                    sw: cordsToMap([center[0] - 0.05, center[1] - 0.05]),
                }} // TODO: Load from dataset
                minZoomLevel={10} //TODO: Load from dataset
                maxZoomLevel={18.9}
                defaultSettings={{ zoomLevel: zoom, centerCoordinate: cordsToMap(center) }}
            />
            <Polygon
                coordinates={[
                    [center[0] - 0.05, center[1] - 0.05],
                    [center[0] + 0.05, center[1] - 0.05],
                    [center[0] + 0.05, center[1] + 0.05],
                    [center[0] - 0.05, center[1] + 0.05],
                ]}
            />
            {/* <ShapeSource id="circleSource" shape={createGeoJSONCircle(center, 10)}>
                <FillLayer
                    id="circleLayer"
                    style={{
                        fillAntialias: true,
                        fillColor: "blue",
                        fillOpacity: 0.5,
                    }}
                />
            </ShapeSource>
            <ShapeSource id="circleSource2" shape={createGeoJSONCircle([49, 50], 10)}>
                <FillLayer
                    id="circleLayer2"
                    style={{
                        fillAntialias: true,
                        fillColor: "blue",
                        fillOpacity: 0.5,
                    }}
                />
            </ShapeSource>
            <ShapeSource
                id="markerSource"
                shape={{
                    coordinates: cordsToMap(poiCords),
                    type: "Point",
                }}>
                <SymbolLayer id="markerView" />
            </ShapeSource> */}
            {/* <PointAnnotation id="poiMarker" coordinate={cordsToMap(poiCords)}>
                <></>
            </PointAnnotation> */}
        </MapView>
    );
};

export default Map;
