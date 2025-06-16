import { Coordinates } from "~/types/models";
import Map from "~/components/game/Map";
import { useState } from "react";

const DEFAULT_LOCATION = [49.5939614, 17.2509367] as Coordinates;

export default function Screen() {
    const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
    const [zoom, setZoom] = useState(11);

    return <Map center={location} zoom={zoom} />;
}
