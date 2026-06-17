import z from "zod";

export const getZodDefaultValue = (schema: any): any => {
	// Use explicitly defined default value
	if (schema instanceof z.ZodDefault) {
		const defaultValue = (schema as any).def?.defaultValue;
		return typeof defaultValue === "function" ? defaultValue() : defaultValue;
	}

	// Unwrap optional/exact-optional/non-optional wrappers
	if (schema instanceof z.ZodOptional || schema instanceof z.ZodExactOptional || schema instanceof z.ZodNonOptional)
		return getZodDefaultValue(schema.unwrap());

	// Nullable wrapper
	if (schema instanceof z.ZodNullable) return null;

	// Object: recursively build default from shape
	if (schema instanceof z.ZodObject) {
		const shape = schema.shape;
		return Object.fromEntries(
			Object.entries(shape).map(([key, field]) => [key, getZodDefaultValue(field as z.ZodType)]),
		);
	}

	// Array: array with one default item
	if (schema instanceof z.ZodArray) return [getZodDefaultValue((schema as any).element)];

	// Tuple: array of defaults for each item
	if (schema instanceof z.ZodTuple) {
		const items = (schema as any).def?.items || (schema as any).items || [];
		return Array.isArray(items) ? items.map(getZodDefaultValue) : [];
	}

	// Primitives
	if (schema instanceof z.ZodNumber) return 0;

	if (schema instanceof z.ZodString) return "";

	if (schema instanceof z.ZodBoolean) return false;

	// Literal: return its value
	if (schema instanceof z.ZodLiteral) return (schema as any).def?.value;

	// Enum: return first option
	if (schema instanceof z.ZodEnum) return schema.options?.join("|");

	// Collections
	if (schema instanceof z.ZodRecord) return {};

	if (schema instanceof z.ZodMap) return new Map();

	if (schema instanceof z.ZodSet) return new Set();

	if (schema instanceof z.ZodDate) return new Date();

	if (
		schema instanceof z.ZodLazy ||
		schema instanceof z.ZodCatch ||
		schema instanceof z.ZodReadonly ||
		schema instanceof z.ZodPrefault ||
		schema instanceof z.ZodSuccess
	)
		return getZodDefaultValue(schema.unwrap());

	if (schema instanceof z.ZodPipe) return getZodDefaultValue((schema as any).out || (schema as any).def?.right);

	if (schema instanceof z.ZodTransform) {
		const innerType = (schema as any).def?.innerType || (schema as any).in;
		return innerType ? getZodDefaultValue(innerType) : undefined;
	}

	if (schema instanceof z.ZodIntersection) {
		const left = (schema as any).def?.left;
		const right = (schema as any).def?.right;
		return {
			...getZodDefaultValue(left),
			...getZodDefaultValue(right),
		};
	}

	if (schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion) {
		const options = (schema as any).def?.options || schema.options;
		return options?.[0] ? getZodDefaultValue(options[0]) : undefined;
	}

	if (schema instanceof z.ZodNull) return null;

	return undefined;
};

export const stringifyConfigJSON = (template: any): string =>
	JSON.stringify(template, null, 3).replaceAll(/\[\s*0,\s*0\s*]/g, "[0,0]");

export const formatConfigJSON = (template: string): string => {
	try {
		const parsed = JSON.parse(template);
		return stringifyConfigJSON(parsed);
	} catch {
		return template;
	}
};
