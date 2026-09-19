// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { sharedExtends, sharedRules } from "../../eslint.shared.mjs";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.ts"],
		extends: sharedExtends,
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.node,
		},
		rules: sharedRules,
	},
]);
