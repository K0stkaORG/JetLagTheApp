"use strict";

const { runPicker } = require("./pnpm-script-picker-core");

const getPnpmCommand = () => {
	const npmExecPath = process.env.npm_execpath;
	if (npmExecPath && npmExecPath.toLowerCase().includes("pnpm")) {
		return {
			command: process.execPath,
			argsPrefix: [npmExecPath, "--silent"],
		};
	}

	return { command: "pnpm", argsPrefix: ["--silent"] };
};

runPicker(getPnpmCommand);
