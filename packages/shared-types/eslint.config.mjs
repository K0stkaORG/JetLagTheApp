// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { sharedExtends, sharedRules } from "../../eslint.shared.mjs";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		// Isomorphic package (consumed by Node + browsers), so both globals apply.
		files: ["**/*.ts"],
		extends: sharedExtends,
		languageOptions: {
			ecmaVersion: 2022,
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: sharedRules,
	},
]);
