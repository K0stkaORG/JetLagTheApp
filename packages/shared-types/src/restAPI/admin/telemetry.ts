export type AdminLogsResponse = {
	logs: string[];
};

export type AdminStateResponse = {
	state: unknown;
};

export type AdminGeoResponse = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	geoJson: any[];
};
