import { GameServer } from "./GameServer/gameServer";
import { styleText } from "node:util";

const serverReady = () => {
	console.log(`
${styleText(
	["bold"],
	`              =%@%=
           *@@@#:#@@@*
       :*@@@@@%   %@@@@@#:
    -%@@@@@@@@%   %@@@@@@@@%-
  *@@@@@@@@@@@%   %@@@@@@@@@@@*     ***:   =***=    -*
  @@@@@@@@@@#       #@@@@@@@@@@    *@@@#   #@@%@@%  #@:
  @@@@@@@+             *@@@@@@@    @@:#%   #@=  @@= #@:
  @@@@@@@.+%%@=   =@%%+ @@@@@@@    @@ *@:  #@=  @@= #@:
  @@@@@@@@@@@@=   =@@@@@@@@@@@@   :@% =@=  #@=  @@= #@:
  @@@@@@@@@@@@     %@@@@@@@@@@@   #@# .@*  #@@@@@%  #@:
  @@@@@@@@@@@.      @@@@@@@@@@@   @@@@@@%  #@=      #@:
  @@@@@@@@@-         -@@@@@@@@@   @@.  %@. #@=      #@:
  %                           *  :@@   *@= #@=      #@:
  *+                         +*
    =%=                   +%=
       :#*             ##-
          .##.     .##.
              +#*#+
`
)}

       ${styleText(["bold"], "JetLag: The App Server is running on ports:")}
                  🔄️ WebSocket: ${process.env.WS_PORT}
                   🛏️ REST API: ${process.env.SERVER_PORT}

`);
};

const withTimestamp = (message: string) => `${styleText(["gray"], `[${new Date().toLocaleString()}]`)} ${message}`;

const flatten = (arr: any[], noPadding?: true) =>
	arr
		.map((e) => (typeof e === "object" ? JSON.stringify(e, null, 2).split("\n") : e.toString().split("\n")))
		.flat(1)
		.join(
			noPadding
				? "\x1b[0m\n   \x1b[91;1;4m"
				: "\n" + new String(" ").repeat(new Date().toLocaleString().length + 3)
		);

const log = (...message: any[]) => console.log(withTimestamp(flatten(message)));

const serverLog = (
	server:
		| GameServer
		| {
				id: string | number;
				type: string;
		  },
	...message: any[]
) => console.log(withTimestamp(styleText(["cyanBright"], `<${server.id}:${server.type}>`) + " " + message));

const serverLogWithSocket = (
	server:
		| GameServer
		| {
				id: string | number;
				type: string;
		  },
	socket: string,
	...message: any[]
) =>
	console.log(
		withTimestamp(
			styleText(["cyanBright"], `<${server.id}:${server.type}>`) +
				" " +
				styleText(["greenBright"], `{${socket}}`) +
				" " +
				message
		)
	);

const orchestratorLog = (...message: any[]) =>
	console.log(withTimestamp(styleText(["magentaBright"], "<Orchestrator>") + " " + message));

const orchestratorLogWithSocket = (socket: string, ...message: any[]) =>
	console.log(
		withTimestamp(
			styleText(["magentaBright"], "<Orchestrator>") +
				" " +
				styleText(["greenBright"], `{${socket}}`) +
				" " +
				message
		)
	);

const warn = (...message: any[]) =>
	console.log(withTimestamp(styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))));

const serverWarn = (
	server:
		| GameServer
		| {
				id: string | number;
				type: string;
		  },
	...message: any[]
) =>
	console.log(
		withTimestamp(
			styleText(["cyanBright", "bold"], `<${server.id}:${server.type}>`) +
				" " +
				styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))
		)
	);

const serverWarnWithSocket = (
	server:
		| GameServer
		| {
				id: string | number;
				type: string;
		  },
	socket: string,
	...message: any[]
) =>
	console.log(
		withTimestamp(
			styleText(["cyanBright", "bold"], `<${server.id}:${server.type}>`) +
				" " +
				styleText(["greenBright"], `{${socket}}`) +
				" " +
				styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))
		)
	);

const orchestratorWarn = (...message: any[]) =>
	console.log(
		withTimestamp(
			styleText(["magentaBright"], "<Orchestrator>") +
				" " +
				styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))
		)
	);

const orchestratorWarnWithSocket = (socket: string, ...message: any[]) =>
	console.log(
		withTimestamp(
			styleText(["magentaBright"], "<Orchestrator>") +
				" " +
				styleText(["greenBright"], `{${socket}}`) +
				" " +
				styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))
		)
	);

const error = (...message: any[]) => {
	console.log(
		"\n\n❗ " + styleText(["redBright", "bold", "underline"], "Error: " + flatten(message, true)) + "\x1b[31;2m"
	);
	console.log(`\nTimestamp\n   ${new Date().toLocaleString()}`);
	console.trace();
	console.log("\x1b[0m\n");
};

export const io = {
	serverReady,
	log,
	warn,
	error,
	server: {
		log: serverLog,
		logWithSocket: serverLogWithSocket,
		warn: serverWarn,
		warnWithSocket: serverWarnWithSocket,
	},
	orchestrator: {
		log: orchestratorLog,
		logWithSocket: orchestratorLogWithSocket,
		warn: orchestratorWarn,
		warnWithSocket: orchestratorWarnWithSocket,
	},
};
