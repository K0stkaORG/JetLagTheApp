import { AdminTelemetryStateResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { logger } from "~/lib/logger";
import { AdminRouteHandler } from "../../middleware/admin";

const adminTelemetryRouter: Router = Router();

const IGNORED_KEYS = new Set(["io", "asyncStorage", "server"]);

function isIdMap(val: unknown): boolean {
	if (val === null || typeof val !== "object") return false;
	const name = val.constructor?.name;
	if (name === "IdMap") return true;
	return "idToObjectMap" in val && (val as { idToObjectMap?: unknown }).idToObjectMap instanceof Map;
}

function serializeValue(val: unknown, visited = new WeakSet<object>()): unknown {
	if (val === null || val === undefined) return val;
	if (typeof val === "function") return undefined;
	if (val instanceof Date) return val.toISOString();
	if (val instanceof RegExp) return val.toString();

	if (typeof val !== "object") return val;

	if (visited.has(val as object)) return "[Circular]";
	visited.add(val as object);

	if (isIdMap(val)) {
		const map = (val as { idToObjectMap?: unknown }).idToObjectMap;
		if (map && typeof map === "object") {
			const result = serializeValue(map, visited);
			visited.delete(val as object);
			if (result && typeof result === "object" && !Array.isArray(result)) {
				(result as any)["__type__"] = "IdMap";
			}
			return result;
		}
	}

	if (Array.isArray(val)) {
		const result = val
			.filter((item) => typeof item !== "function")
			.map((item) => serializeValue(item, visited));
		visited.delete(val as object);
		return result;
	}

	if (val instanceof Map) {
		const obj: Record<string, unknown> = {};
		for (const [k, v] of val.entries()) {
			if (typeof v !== "function") {
				obj[String(k)] = serializeValue(v, visited);
			}
		}
		visited.delete(val as object);
		return obj;
	}

	if (val instanceof Set) {
		const result = Array.from(val.values())
			.filter((item) => typeof item !== "function")
			.map((item) => serializeValue(item, visited));
		visited.delete(val as object);
		return result;
	}

	const obj: Record<string, unknown> = {};
	const protoName = val.constructor?.name;
	if (protoName && protoName !== "Object") {
		obj["__type__"] = protoName;
	}

	for (const key of Reflect.ownKeys(val)) {
		const keyStr = typeof key === "symbol" ? key.toString() : String(key);
		if (IGNORED_KEYS.has(keyStr)) continue;

		const descriptor = Object.getOwnPropertyDescriptor(val, key);
		if (!descriptor) continue;

		let propVal: unknown;
		try {
			if ("value" in descriptor) {
				propVal = descriptor.value;
			} else if (descriptor.get) {
				propVal = descriptor.get.call(val);
			}
		} catch {
			continue;
		}

		if (typeof propVal === "function" || propVal instanceof Function) {
			continue;
		}

		const serialized = serializeValue(propVal, visited);
		if (serialized !== undefined) {
			obj[keyStr] = serialized;
		}
	}

	visited.delete(val as object);
	return obj;
}

function isGeoJsonGeometry(obj: any): boolean {
	if (!obj || typeof obj !== "object") return false;
	const type = obj.type;
	return (
		(type === "Point" ||
			type === "LineString" ||
			type === "Polygon" ||
			type === "MultiPoint" ||
			type === "MultiLineString" ||
			type === "MultiPolygon") &&
		Array.isArray(obj.coordinates)
	);
}

function extractGeoJsonFeatures(val: unknown, visited = new WeakSet<object>(), path = ""): any[] {
	if (val === null || val === undefined || typeof val !== "object") return [];
	if (visited.has(val as object)) return [];
	visited.add(val as object);

	const features: any[] = [];
	const obj = val as any;

	if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
		for (const feat of obj.features) {
			if (feat && feat.type === "Feature") {
				features.push({
					...feat,
					properties: { path, ...feat.properties },
				});
			}
		}
	} else if (obj.type === "Feature" && isGeoJsonGeometry(obj.geometry)) {
		features.push({
			...obj,
			properties: { path, ...obj.properties },
		});
	} else if (isGeoJsonGeometry(obj)) {
		features.push({
			type: "Feature",
			properties: { path },
			geometry: obj,
		});
	} else {
		let lat: number | undefined;
		let lng: number | undefined;

		if (typeof obj.lat === "number" && (typeof obj.lng === "number" || typeof obj.lon === "number")) {
			lat = obj.lat;
			lng = typeof obj.lng === "number" ? obj.lng : obj.lon;
		} else if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
			lat = obj.latitude;
			lng = obj.longitude;
		} else if (
			obj.cords &&
			typeof obj.cords.lat === "number" &&
			(typeof obj.cords.lng === "number" || typeof obj.cords.lon === "number")
		) {
			lat = obj.cords.lat;
			lng = typeof obj.cords.lng === "number" ? obj.cords.lng : obj.cords.lon;
		}

		if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
			features.push({
				type: "Feature",
				properties: {
					path,
					name: obj.name || obj.nickname || obj.id || path,
				},
				geometry: {
					type: "Point",
					coordinates: [lng, lat],
				},
			});
		}

		if (Array.isArray(obj)) {
			obj.forEach((item, i) => {
				features.push(...extractGeoJsonFeatures(item, visited, `${path}.${i}`));
			});
		} else if (obj instanceof Map) {
			for (const [k, v] of obj.entries()) {
				features.push(...extractGeoJsonFeatures(v, visited, `${path}.${k}`));
			}
		} else if (obj instanceof Set) {
			Array.from(obj.values()).forEach((v, i) => {
				features.push(...extractGeoJsonFeatures(v, visited, `${path}.${i}`));
			});
		} else {
			for (const key of Reflect.ownKeys(obj)) {
				const keyStr = typeof key === "symbol" ? key.toString() : String(key);
				if (IGNORED_KEYS.has(keyStr)) continue;

				let propVal: unknown;
				try {
					const desc = Object.getOwnPropertyDescriptor(obj, key);
					if (desc && "value" in desc) propVal = desc.value;
					else if (desc && desc.get) propVal = desc.get.call(obj);
				} catch {
					continue;
				}

				if (typeof propVal === "object" && propVal !== null) {
					features.push(...extractGeoJsonFeatures(propVal, visited, path ? `${path}.${keyStr}` : keyStr));
				}
			}
		}
	}

	visited.delete(val as object);
	return features;
}

adminTelemetryRouter.get(
	"/",
	AdminRouteHandler(null, async (): Promise<AdminTelemetryStateResponse> => {
		const rawState = Orchestrator.instance;
		return {
			logs: logger.logs as string[],
			state: serializeValue(rawState),
			geoJson: {
				type: "FeatureCollection",
				features: extractGeoJsonFeatures(rawState),
			},
		};
	}),
);

export { adminTelemetryRouter };
