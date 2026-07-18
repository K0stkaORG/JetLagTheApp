import chalk from "chalk";
import { DrizzleQueryError } from "drizzle-orm";
import { localize } from "./branding/date";
import { ExtendedError, UserRequestError } from "./errors";
import { GameServer } from "./game/gameServer/gameServer";

const LOG_STORE_LIMIT = 100;

const PADDING = chalk.gray.dim("⠐") + "  ";

const LOG_LEVEL_STYLES = {
	INFO: chalk.bold.bgWhiteBright.black,
	WARN: chalk.bold.bgYellowBright.black,
	ERROR: chalk.bold.bgRedBright.white,
} as const;

type Node = string | Node[] | { items: Node[]; trailingComma?: boolean };

const LogStore: string[] = [];
let onLogCallback: ((log: string) => void) | null = null;

const formatParam = (param: unknown, root: boolean = true): Node => {
	if (Array.isArray(param)) {
		if (root && param.length === 1 && !Array.isArray(param[0])) return formatParam(param[0], false);

		return {
			items: param.flatMap((p, i) => {
				const item = formatParam(p, false);

				if (typeof p === "object" && p !== null)
					return Array.isArray(item)
						? item.map((e, i) => (i == item.length - 1 ? e + "," : e))
						: { items: (item as { items: string[] }).items, trailingComma: i != param.length - 1 };

				return [item + (i != param.length - 1 ? "," : "")];
			}),
		};
	}

	if (param instanceof ExtendedError) {
		const previous = param.details.error
			? [[chalk.dim.bold("Cause:"), formatParam(param.details.error, false)]]
			: [];
		const details = Object.entries(param.details)
			.filter(([key]) => key !== "error")
			.map(([key, value]) => `${chalk.dim.bold(key)}: ${formatParam(value, false)}`);

		const stack =
			(!param.details.error || !(param.details.error instanceof ExtendedError)) && param.stack
				? param.stack.split("\n    at ")[1]?.trim()
				: null;
		if (stack) previous.unshift([chalk.dim.bold("Thrown at: ") + stack]);

		if (details.length > 0)
			return [`${chalk.red.bold("Error:")} ${param.message}`, [chalk.dim.bold("Details:"), details], ...previous];

		return [`${chalk.red.bold("Error:")} ${param.message}`, ...previous];
	}

	if (param instanceof UserRequestError) return chalk.red.bold(param.message).split("\n");

	if (param instanceof DrizzleQueryError)
		return [
			chalk.red.bold(`DrizzleError:`) + ` ${param.message.split("\n")[0]}`,
			[
				chalk.dim.bold("Code: ") + ((param.cause as Record<string, unknown> | undefined)?.code ?? "Unknown"),
				chalk.dim.bold("Query: ") + param.query,
				chalk.dim.bold("Params: ") + param.params.map((p) => JSON.stringify(p)).join(", "),
			],
		];

	if (param instanceof Error) {
		const stack = param.stack?.split("\n    at ")[1]?.trim();
		return stack
			? [`${chalk.red.bold("Error:")} ${param.message}`, [chalk.dim.bold("Thrown at: ") + stack]]
			: `${chalk.red.bold("Error:")} ${param.message}`;
	}

	if (param instanceof GameServer) return chalk.greenBright.bold(param.fullName);

	const nodes = typeof param === "string" ? param.split("\n") : JSON.stringify(param, null, 2).split("\n");
	if (nodes.length == 1 && nodes[0] !== "{}") return nodes[0];
	return nodes;
};

const stringifyNodeTree = (node: Node, depth: number = 0): string => {
	if (Array.isArray(node)) return node.map((n) => stringifyNodeTree(n, depth + 1)).join("");

	let string = "";

	if (typeof node === "object" && node !== null && "items" in node) {
		if (depth > 0) string += `\n${PADDING.repeat(depth)}[`;

		string += node.items.map((n: Node) => stringifyNodeTree(n, depth + 1)).join("");

		if (depth > 0) string += `${node.items.length > 0 ? "\n" + PADDING.repeat(depth) : ""}]`;

		if (node.trailingComma) string += ",";

		return string;
	}

	if (depth > 0) string += "\n";

	string += PADDING.repeat(depth) + node;

	return string;
};

const processLog = (level: "INFO" | "WARN" | "ERROR", args: unknown[]) => {
	const timestamp = localize.timestamp(new Date());

	const log = `${chalk.dim(`[${timestamp}]`)} ${LOG_LEVEL_STYLES[level](` ${level} `)} ${stringifyNodeTree(formatParam(args))}\n`;

	process.stdout.write(log);

	onLogCallback?.(log);

	(LogStore as string[]).push(log);

	if (LogStore.length > LOG_STORE_LIMIT) (LogStore as string[]).shift();
};

export const logger = {
	info: (...args: unknown[]) => processLog("INFO", args),
	warn: (...args: unknown[]) => processLog("WARN", args),
	error: (error: Error | string | unknown) => processLog("ERROR", [error]),
	logs: LogStore as Readonly<string[]>,
	bindCallback: (callback: (log: string) => void) => {
		onLogCallback = callback;
	},
};
