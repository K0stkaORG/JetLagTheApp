import { IdMap } from "@jetlag/shared-types";
import { customType } from "drizzle-orm/pg-core";

export const jsonbWithIdMap = <TData>(name: string) =>
	customType<{ data: TData; driverData: string | object }>({
		dataType() {
			return "jsonb";
		},
		toDriver(value: TData): string {
			return JSON.stringify(value);
		},
		fromDriver(value: unknown): TData {
			if (typeof value === "string") return JSON.parse(value, IdMap.reviver);

			if (typeof value === "object" && value !== null) return JSON.parse(JSON.stringify(value), IdMap.reviver);

			return value as TData;
		},
	})(name);
