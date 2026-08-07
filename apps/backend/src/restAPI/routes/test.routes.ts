import { Router } from "express";
import { ExtendedError } from "~/lib/errors";
import { HideAndSeekServer } from "~/lib/gamemodes/hideAndSeek/hideAndSeekServer";
import { Orchestrator } from "~/lib/orchestrator/orchestrator";
import { RouteHandler } from "../middleware/validation";

const testRouter: Router = Router();

testRouter.get(
	"/state",
	RouteHandler(null, () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		return server.state.get;
	}),
);

testRouter.get(
	"/draw1",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		try {
			return await server.dealer.draw(1);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/draw3",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		try {
			return await server.dealer.draw(3);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/commit1",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		const offered = server.state.get.offeredCards ?? [1];

		try {
			return await server.dealer.commit([offered[0]]);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/commitAll",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		const offered = server.state.get.offeredCards ?? [];

		try {
			return await server.dealer.commit(offered);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/commitNone",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		try {
			return await server.dealer.commit([]);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/commitDuplicate",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		const offered = server.state.get.offeredCards ?? [1];

		try {
			return await server.dealer.commit([offered[0], offered[0]]);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

testRouter.get(
	"/commitMadeUp",
	RouteHandler(null, async () => {
		const server = Orchestrator.instance["servers"].items[0]! as HideAndSeekServer;

		try {
			return await server.dealer.commit([9999]);
		} catch (error) {
			return ExtendedError.extractUserRequestError(error);
		}
	}),
);

export { testRouter };
