import chalk from "chalk";
import { DrizzleQueryError } from "drizzle-orm";
import { ENV } from "~/env";
import { localize } from "./branding/date";
import { ExtendedError, UserRequestError } from "./errors";
import { GameServer } from "./game/gameServer/gameServer";

const PADDING = chalk.gray.dim("⠐") + "  ";

const LOG_LEVEL_STYLES = {
	INFO: chalk.bold.bgWhiteBright.black,
	WARN: chalk.bold.bgYellowBright.black,
	ERROR: chalk.bold.bgRedBright.white,
} as const;

type Node = string | Node[] | { items: Node[] };

const formatParam = (param: unknown, root: boolean = true): Node => {
	if (Array.isArray(param)) {
		if (root && param.length === 1 && !Array.isArray(param[0])) return formatParam(param[0], false);

		return {
			items: param.flatMap((p) => {
				const item = formatParam(p, false);

				if (typeof p === "object" && p !== null) return item;

				return [item];
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

	if (param instanceof UserRequestError) return chalk.red.bold(param.message);

	if (param instanceof DrizzleQueryError)
		return [
			chalk.red.bold(`DrizzleError:`) + ` ${param.message.split("\n")[0]}`,
			[
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

	const nodes = (typeof param === "string" ? param : JSON.stringify(param, null, 2)).split("\n");
	if (nodes.length == 1 && nodes[0] !== "{}") return nodes[0];
	return nodes;
};

const printNodeTree = (node: Node, depth: number = 0) => {
	if (Array.isArray(node)) return node.forEach((n) => printNodeTree(n, depth + 1));

	if (typeof node === "object" && node !== null && "items" in node) {
		if (depth > 0) process.stdout.write(`\n${PADDING.repeat(depth)}[`);

		node.items.forEach((n: Node) => {
			printNodeTree(n, depth + 1);
			process.stdout.write(",");
		});

		if (depth > 0) process.stdout.write(`\n${PADDING.repeat(depth)}]`);

		return;
	}

	if (depth > 0) process.stdout.write("\n");

	process.stdout.write(PADDING.repeat(depth) + node);
};

const printLog = (level: "INFO" | "WARN" | "ERROR", args: unknown[]) => {
	const timestamp = localize.timestamp(new Date());

	process.stdout.write(`${chalk.dim(`[${timestamp}]`)} ${LOG_LEVEL_STYLES[level](` ${level} `)} `);

	printNodeTree(formatParam(args));

	process.stdout.write("\n");
};

export const logger = {
	info: ENV.NODE_ENV === "development" ? (...args: unknown[]) => printLog("INFO", args) : (..._args: unknown[]) => {},
	warn: (...args: unknown[]) => printLog("WARN", args),
	error: (error: Error | string | unknown) => printLog("ERROR", [error]),
};
