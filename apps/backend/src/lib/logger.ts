import winston from "winston";
import { ENV } from "~/env";

const logLevel = process.env.LOG_LEVEL || "info";

export const logger = winston.createLogger({
	level: logLevel,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.colorize(),
				winston.format.printf(({ level, message, timestamp, ...meta }) => {
					let msg = `${timestamp} (${level}): ${message}`;

					delete meta.stack;

					if (ENV.NODE_ENV === "development") {
						if (Object.keys(meta).length > 0) msg += `\n${JSON.stringify(meta, null, 2)}`;
					} else if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;

					return msg;
				}),
			),
		}),
	],
});
