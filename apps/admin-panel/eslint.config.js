import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { reactRules, sharedExtends, sharedRules } from "../../eslint.shared.mjs";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [...sharedExtends, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.browser,
		},
		rules: {
			...sharedRules,
			...reactRules,
		},
	},
]);
