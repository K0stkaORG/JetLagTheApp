import { Camera, Logger, MapView } from "@maplibre/maplibre-react-native";

import { cordsToMap } from "~/lib/map";

interface MapProps {
    center: [number, number];
    zoom: number;
}

Logger.setLogCallback((log) => log.tag === "Mbgl-HttpRequest");

const Map = ({ center, zoom }: MapProps) => {
    return (
        <MapView
            style={{ flex: 1 }}
            logoEnabled={false}
            mapStyle="https://tiles.openfreemap.org/styles/liberty">
            <Camera zoomLevel={zoom} centerCoordinate={cordsToMap(center)} />
        </MapView>
    );
};

export default Map;
