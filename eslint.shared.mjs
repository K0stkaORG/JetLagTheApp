// @ts-check
// Single source of truth for ESLint rules across the monorepo.
//
// Each package keeps a thin `eslint.config.js` wrapper around this module
// because flat-config `files` matching is cwd-relative, so one root
// `eslint.config.js` cannot serve every package via `pnpm --filter` scripts.
// `apps/mobile` is the intentional exception: it stays on `expo lint`
// (Expo-managed config).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Base extends shared by every package. */
export const sharedExtends = [js.configs.recommended, ...tseslint.configs.recommended];

/**
 * Rules applied identically in every package (team decisions, Sep 2026):
 * - `@typescript-eslint/no-explicit-any`: warn
 * - `no-console`: warn
 * - `@typescript-eslint/no-unused-vars`: error, `_`-prefixed args/vars exempt
 * - `no-mixed-spaces-and-tabs`: error
 * - `@turf/turf` banned (use individual `@turf/*` packages)
 * - bare `src/*` imports banned (use the `@/*` alias or a relative import,
 *   so tsc and bundlers resolve identically)
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const sharedRules = {
	"@typescript-eslint/no-explicit-any": "warn",
	"no-console": "warn",
	"@typescript-eslint/no-unused-vars": [
		"error",
		{
			argsIgnorePattern: "^_",
			varsIgnorePattern: "^_",
			caughtErrorsIgnorePattern: "^_",
		},
	],
	// `smartTabs`: Prettier (useTabs) aligns union-type closers with spaces
	// after tabs (e.g. `\t  }`) — allow that, still flag real mixing.
	"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
	"no-restricted-imports": [
		"error",
		{
			patterns: [
				{
					group: ["@turf/turf"],
					message: "Use individual @turf/* packages instead (e.g. @turf/circle, @turf/buffer).",
				},
				{
					group: ["src/*"],
					message: "Use the @/* alias or a relative import so tsc and bundlers resolve identically.",
				},
			],
		},
	],
};

/**
 * React overrides (team decisions). Spread into `rules` only where the
 * corresponding plugins are loaded.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const reactRules = {
	"react-hooks/rules-of-hooks": "off",
	"react-refresh/only-export-components": "off",
};
