import { Camera, FillLayer, Logger, MapView, ShapeSource } from "@maplibre/maplibre-react-native";

import { Coordinates } from "~/types/models";
import { cordsToMap } from "~/lib/map";
import { useGameData } from "~/context/game";

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

const Map = () => {
    // const [poiCords, setPoiCoords] = useState<Coordinates>(center);

    // useEffect(() => {
    //     const interval = setInterval(
    //         () =>
    //             setPoiCoords([
    //                 center[0] + 0.0001 * Math.sin(Date.now() / 1000),
    //                 center[1] + 0.0001 * Math.cos(Date.now() / 1000),
    //             ]),
    //         1000
    //     );

    //     return () => clearInterval(interval);
    // }, []);

    // requestAndroidLocationPermissions();

    const { map } = useGameData();

    return (
        <MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            attributionEnabled={false}
            compassViewPosition={3}
            mapStyle="https://tiles.openfreemap.org/styles/liberty">
            {/* <UserLocation androidRenderMode="compass" /> */}
            <Camera
                maxBounds={{
                    ne: cordsToMap(map.centreBoundingBox.ne),
                    sw: cordsToMap(map.centreBoundingBox.sw),
                }}
                minZoomLevel={map.zoom.min}
                maxZoomLevel={map.zoom.max}
                defaultSettings={{
                    zoomLevel: map.zoom.initial,
                    centerCoordinate: cordsToMap(map.startingPosition),
                }}
                pitch={0}
            />
            <Polygon coordinates={map.gameAreaPolygon} />
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
