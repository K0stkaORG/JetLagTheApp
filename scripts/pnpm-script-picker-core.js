"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { Select } = require("enquirer");

// File locations
const PACKAGE_JSON_PATH = path.join(process.cwd(), "package.json");
const LAST_RUN_PATH = path.join(__dirname, ".pnpm-script-picker-last");

// Internal sentinel for rerun option routing.
// We keep this internal and render human-friendly labels in the UI.
const RERUN_CHOICE_VALUE = "__rerun_last__";

// For regular 1..9 shortcuts, map keypress digit -> zero-based list index.
const DEFAULT_DIGIT_TO_INDEX = (digit) => (digit === 0 ? 9 : digit - 1);

const exitWithMessage = (message, code) => {
	if (message) {
		if (code === 0) {
			console.log(message);
		} else {
			console.error(message);
		}
	}
	process.exit(code);
};

const clearConsole = () => {
	process.stdout.write("\x1b[2J\x1b[0f");
};

// Reads the persisted last-run script, but only if it still exists in package scripts.
const readLastRunScript = (validScriptNames) => {
	try {
		const script = fs.readFileSync(LAST_RUN_PATH, "utf8").trim();
		if (!script) return null;
		if (!validScriptNames.has(script)) return null;
		return script;
	} catch {
		return null;
	}
};

// Best-effort persistence; failures should not block running scripts.
const saveLastRunScript = (scriptName) => {
	try {
		fs.writeFileSync(LAST_RUN_PATH, scriptName, "utf8");
	} catch {
		// ignore write failures (readonly FS, permissions, etc.)
	}
};

// Loads package scripts and groups by the segment before ':'.
// Example: "lint:backend" -> group "lint".
const loadScriptGroups = () => {
	if (!fs.existsSync(PACKAGE_JSON_PATH)) {
		exitWithMessage("package.json not found in current directory.", 1);
	}

	const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
	const scripts = packageJson.scripts || {};
	const scriptNames = Object.keys(scripts).filter((name) => name !== "e" && name !== "f");

	if (scriptNames.length === 0) {
		exitWithMessage("No scripts found in package.json.", 0);
	}

	const groups = new Map();
	for (const scriptName of scriptNames) {
		const [groupName] = scriptName.split(":");
		if (!groups.has(groupName)) {
			groups.set(groupName, []);
		}
		groups.get(groupName).push(scriptName);
	}

	if (groups.size === 0) {
		exitWithMessage("No scripts found in package.json.", 0);
	}

	for (const [groupName, groupScripts] of groups) {
		groups.set(
			groupName,
			groupScripts.slice().sort((a, b) => a.localeCompare(b)),
		);
	}

	return {
		scriptNames: new Set(scriptNames),
		groups,
	};
};

// Adds 0-9 hotkeys to Enquirer Select prompt.
const attachNumberHotkeys = (prompt, count, getIndexForDigit) => {
	prompt.number = async (input) => {
		const digit = Number.parseInt(String(input), 10);
		if (Number.isNaN(digit)) return prompt.alert();
		const index = typeof getIndexForDigit === "function" ? getIndexForDigit(digit) : DEFAULT_DIGIT_TO_INDEX(digit);
		if (index < 0 || index >= count) return prompt.alert();
		const choice = Array.isArray(prompt.choices) ? prompt.choices[index] : undefined;
		if (!choice) return prompt.alert();
		if (typeof prompt.isDisabled === "function" && prompt.isDisabled(choice)) return prompt.alert();
		if (typeof prompt.focus === "function") {
			prompt.focus(choice, true);
		} else if (prompt.state) {
			prompt.state.index = choice.index ?? index;
		}
		if (typeof prompt.render === "function") await prompt.render();
		if (typeof prompt.submit === "function") return prompt.submit();
	};
};

// Builds the first menu (rerun + groups).
const buildGroupChoices = (groups, lastRunScript) => {
	const groupChoices = [];
	if (lastRunScript) {
		groupChoices.push({
			name: lastRunScript,
			message: `0) ${lastRunScript} (re-run last command)`,
			value: RERUN_CHOICE_VALUE,
		});
	}

	let groupNumber = 1;
	for (const groupName of groups.keys()) {
		const groupScripts = groups.get(groupName) || [];
		const groupLabel = groupScripts.length === 1 ? groupScripts[0] : groupName;
		groupChoices.push({
			name: groupName,
			message: `${groupNumber}) ${groupLabel}`,
			value: groupName,
		});
		groupNumber += 1;
	}

	return groupChoices;
};

// In the group menu, when rerun exists: 0 -> rerun, 1 -> first group, etc.
const getGroupMenuIndexForDigit = (digit, hasRerunOption) => {
	if (!hasRerunOption) {
		return DEFAULT_DIGIT_TO_INDEX(digit);
	}

	if (digit === 0) return 0;
	return digit;
};

// Standardized select prompt runner that always returns `choice.value` if present.
const selectChoice = async ({ message, choices, getIndexForDigit }) => {
	const prompt = new Select({
		name: "selection",
		message,
		choices,
	});
	prompt.result = () => {
		const focusedChoice = prompt.focused;
		if (focusedChoice && Object.prototype.hasOwnProperty.call(focusedChoice, "value")) {
			return focusedChoice.value;
		}
		return focusedChoice?.name;
	};
	attachNumberHotkeys(prompt, choices.length, getIndexForDigit);
	return prompt.run();
};

const runScript = ({ getPnpmCommand, scriptName }) => {
	saveLastRunScript(scriptName);
	const { command, argsPrefix } = getPnpmCommand();
	const args = [...argsPrefix, "run", scriptName];

	let child;
	try {
		child = spawn(command, args, { stdio: "inherit" });
	} catch (err) {
		exitWithMessage(`Failed to start pnpm: ${err?.message || err}`, 1);
		return;
	}

	child.on("error", (err) => {
		exitWithMessage(`Failed to start pnpm: ${err?.message || err}`, 1);
	});

	child.on("exit", (code) => {
		process.exit(code ?? 0);
	});
};

const runPicker = async (getPnpmCommand) => {
	const { groups, scriptNames } = loadScriptGroups();
	const lastRunScript = readLastRunScript(scriptNames);
	const groupChoices = buildGroupChoices(groups, lastRunScript);

	try {
		clearConsole();

		const groupSelection = await selectChoice({
			message: "Select a script group",
			choices: groupChoices,
			getIndexForDigit: (digit) => getGroupMenuIndexForDigit(digit, Boolean(lastRunScript)),
		});

		if (groupSelection === RERUN_CHOICE_VALUE && lastRunScript) {
			runScript({ getPnpmCommand, scriptName: lastRunScript });
			return;
		}

		const groupName = groupSelection;
		const groupScripts = groups.get(groupName) || [];
		if (groupScripts.length === 0) {
			exitWithMessage("No scripts found in that group.", 0);
			return;
		}

		if (groupScripts.length === 1) {
			runScript({ getPnpmCommand, scriptName: groupScripts[0] });
			return;
		}

		const scriptChoices = groupScripts.map((name, index) => ({
			name,
			message: `${index + 1}) ${name}`,
			value: name,
		}));

		const scriptName = await selectChoice({
			message: `Select a pnpm script (${groupName})`,
			choices: scriptChoices,
		});

		runScript({ getPnpmCommand, scriptName });
	} catch (error) {
		if (error === "SIGINT" || error === "SIGTERM") {
			process.exit(130);
			return;
		}
		exitWithMessage(error?.message || "Script picker failed.", 1);
	}
};

module.exports = {
	runPicker,
};
