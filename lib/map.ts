export const cordsToMap = (cords: [number, number]) => [cords[1], cords[0]];

export const createGeoJSONCircle = (
    center: [number, number],
    radiusInMeters: number,
    points: number = 1000
) => {
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
        const angle = ((i * 360) / points) * (Math.PI / 180);
        const dx = radiusInMeters * Math.cos(angle);
        const dy = radiusInMeters * Math.sin(angle);
        const offsetLat = dy / 111320; // degrees per meter latitude
        const offsetLon = dx / ((40075000 * Math.cos((center[1] * Math.PI) / 180)) / 360); // degrees per meter longitude
        coords.push([center[0] + offsetLon, center[1] + offsetLat]);
    }
    coords.push(coords[0]);
    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [coords],
        },
        properties: {},
    };
};
