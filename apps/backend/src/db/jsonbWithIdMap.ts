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
		fromDriver(value: string | object): TData {
			if (typeof value === "string") return JSON.parse(value, IdMap.reviver);

			if (value !== null && typeof value === "object") return IdMap.fromObject(value);

			return value;
		},
	})(name);
