"use strict";

const path = require("path");
const { runPicker } = require("./pnpm-script-picker-core");

const JS_EXTENSIONS = new Set([".js", ".cjs", ".mjs"]);

const getPnpmCommand = () => {
	const npmExecPath = process.env.npm_execpath;
	if (npmExecPath && npmExecPath.toLowerCase().includes("pnpm")) {
		// npm_execpath may point to either a JS entry file (run via node) or to
		// pnpm's standalone native binary (e.g. @pnpm/exe). Running a native
		// binary through node crashes with a SyntaxError, so dispatch on the
		// file extension.
		const ext = path.extname(npmExecPath).toLowerCase();
		if (JS_EXTENSIONS.has(ext)) {
			return {
				command: process.execPath,
				argsPrefix: [npmExecPath, "--silent"],
			};
		}
		return {
			command: npmExecPath,
			argsPrefix: ["--silent"],
		};
	}

	return { command: "pnpm", argsPrefix: ["--silent"] };
};

runPicker(getPnpmCommand);
