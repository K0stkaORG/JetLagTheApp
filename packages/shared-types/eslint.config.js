// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["@turf/turf"],
							message: "Use individual @turf/* packages instead (e.g. @turf/circle, @turf/buffer).",
						},
					],
				},
			],
		},
	},
);
