import z from "zod";

export const DatasetIdSchema = z.int().positive("Dataset ID must be a positive number");
export const DatasetMetadataIdSchema = z.int().positive("Dataset metadata ID must be a positive number");

export const DatasetNameSchema = z.string().min(1, "Dataset name must be at least 1 character long");
