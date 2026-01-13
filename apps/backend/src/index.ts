import { Orchestrator } from "./lib/orchestrator";
import { authHandler } from "./routes/auth";
import cors from "cors";
import { debugHandler } from "./routes/debug";
import { env } from "./env";
import express from "express";
import { gameRouter } from "./routes/game";
import { io } from "./lib/io";
import { syntaxErrorHandler } from "./lib/syntaxErrorHandler";
import { z } from "zod/v4";

z.config(z.locales.cs());

console.clear();

const ORCHESTRATOR = new Orchestrator();

const REST_API = express();

REST_API.use(express.json());
REST_API.use(cors());

REST_API.use(syntaxErrorHandler);

REST_API.use("/auth", authHandler);
REST_API.use("/games", gameRouter(ORCHESTRATOR));
REST_API.use("/debug", debugHandler(ORCHESTRATOR));

Promise.all([REST_API.listen(env.SERVER_PORT), ORCHESTRATOR.listen(env.WS_PORT)]).then(() => io.serverReady());
