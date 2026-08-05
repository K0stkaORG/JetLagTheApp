import { Point } from "../geoJSON";

export type HideAndSeekClientToServerEvents = {
	"hideAndSeek.hiders.pickHidingZoneCenter": (data: { centerId: number }) => void;
	"hideAndSeek.hiders.pickHidingZoneCenter.overrideGPS": (data: { centerId: number }) => void;
	"hideAndSeek.hiders.pickHidingSpot": (data: { point: Point }) => void;
};

export type HideAndSeekServerToClientEvents = {
	"hideAndSeek.hiders.pickHidingZoneCenter.GPSCheckFailed": (data: {
		type: "failedToGetHiderTeamPosition" | "outsideOfHidingZone";
	}) => void;
};
