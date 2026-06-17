import { DEFAULT_STYLE } from "@/constants/map";
import { Camera, Map as MapLibreMap, UserLocation } from "@maplibre/maplibre-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type MapProps = {
	mapStyle?: string;
	center?: [number, number];
	zoom?: number;
	showUserLocation?: boolean;
	children?: React.ReactNode;
};

export default function Map({
	mapStyle = DEFAULT_STYLE,
	center = [0, 20],
	zoom = 2,
	showUserLocation = false,
	children,
}: MapProps) {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<View style={styles.container}>
			<MapLibreMap
				style={styles.map}
				mapStyle={mapStyle}
				logo={false}
				attribution
				scaleBar={false}
				onDidFinishLoadingMap={() => setIsLoading(false)}>
				<Camera
					center={center}
					zoom={zoom}
					duration={0}
				/>
				{showUserLocation && <UserLocation />}
				{children}
			</MapLibreMap>
			{isLoading && (
				<View style={styles.loader}>
					<ActivityIndicator size="large" />
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
	loader: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.7)",
	},
});
