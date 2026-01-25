import { Coordinates as CoordinatesType, Polygon as PolygonType } from "~/types/";
import { customType, pgEnum, point } from "drizzle-orm/pg-core";

export const Team = pgEnum("team", ["hiders", "seekers"]);

export const Polygon = (name: string) =>
	customType<{ data: PolygonType; driverData: string }>({
		dataType() {
			return "jsonb";
		},
		toDriver(value: PolygonType): string {
			return JSON.stringify(value);
		},
	})(name)
		.notNull()
		.$type<PolygonType>();

export const Coordinates = (name: string) => point(name, { mode: "tuple" }).notNull().$type<CoordinatesType>();
