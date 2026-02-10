"use strict";

const fs = require("fs");
const path = require("path");
const { Select } = require("enquirer");
const { spawn } = require("child_process");

const packageJsonPath = path.join(process.cwd(), "package.json");

if (!fs.existsSync(packageJsonPath)) {
	console.error("package.json not found in current directory.");
	process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const scripts = packageJson.scripts || {};

const scriptNames = Object.keys(scripts).filter((name) => name !== "e" && name !== "f");

const groups = new Map();
for (const name of scriptNames) {
	const [groupName] = name.split(":");
	if (!groups.has(groupName)) {
		groups.set(groupName, []);
	}
	groups.get(groupName).push(name);
}

if (scriptNames.length === 0 || groups.size === 0) {
	console.log("No scripts found in package.json.");
	process.exit(0);
}

const attachNumberHotkeys = (prompt, count) => {
	prompt.number = async (input) => {
		const digit = Number.parseInt(String(input), 10);
		if (Number.isNaN(digit)) return prompt.alert();
		const index = digit === 0 ? 9 : digit - 1;
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

const clearConsole = () => {
	process.stdout.write("\x1b[2J\x1b[0f");
};

const groupChoices = Array.from(groups.keys()).map((name, index) => ({
	name,
	message: `${index + 1}) ${name}`,
	value: name,
}));

const groupPrompt = new Select({
	name: "group",
	message: "Select a script group",
	choices: groupChoices,
});

(async () => {
	try {
		clearConsole();
		console.log("\nJetLag Monorepo Script Picker\n");

		attachNumberHotkeys(groupPrompt, groupChoices.length);
		const groupName = await groupPrompt.run();
		const groupScripts = groups.get(groupName) || [];
		if (groupScripts.length === 0) {
			console.log("No scripts found in that group.");
			process.exit(0);
		}

		const scriptChoices = groupScripts.map((name, index) => ({
			name,
			message: `${index + 1}) ${name}`,
			value: name,
		}));

		const scriptPrompt = new Select({
			name: "script",
			message: "Select a pnpm script to run",
			choices: scriptChoices,
		});
		attachNumberHotkeys(scriptPrompt, scriptChoices.length);

		const scriptName = await scriptPrompt.run();

		// Always use pnpm from PATH, not npm_execpath (which may point to a binary)
		const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
		const args = ["run", scriptName];

		const child = spawn(command, args, { stdio: "inherit" });

		child.on("error", (err) => {
			console.error("Failed to start pnpm:", err?.message || err);
			process.exit(1);
		});

		child.on("exit", (code) => {
			process.exit(code ?? 0);
		});
	} catch (error) {
		if (error === "SIGINT" || error === "SIGTERM") {
			process.exit(130);
		}
		console.error("Canceled.");
		if (error?.message) {
			console.error(error.message);
		}
		process.exit(1);
	}
})();
