import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/migrate.ts", "src/lib/game/workers/parseDatasetWorker.ts"],
	format: ["cjs"],
	target: "node20",
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: true,
	treeshake: true,
	keepNames: true,
	// Bundle local workspace packages, but leave third-party dependencies external
	// unless we want a standalone executable (which can have issues with native modules)
	noExternal: ["@jetlag/shared-types"],
});
