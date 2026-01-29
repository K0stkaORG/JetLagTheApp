import { AdminGameInfoResponse, AdminGamesListResponse, AdminRequestWithGameId } from "@jetlag/shared-types";
import Loading, { FullScreenLoader } from "@/screens/Loading.Screen";
import { Outlet, createBrowserRouter, data, isRouteErrorResponse, useRouteError } from "react-router";

import DashboardScreen from "@/screens/Dashboard.screen";
import GamesScreen from "@/screens/Games.screen";
import ManageGameScreen from "@/screens/ManageGameScreen";
import NewGameScreen from "@/screens/NewGame.screen";
import NotFoundScreen from "@/screens/404.screen";
import { RouterProvider } from "react-router/dom";
import { useServer } from "./server";

function RootErrorBoundary() {
	let error = useRouteError();

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) return <NotFoundScreen />;

		return (
			<>
				<h1>
					{error.status} {error.statusText}
				</h1>
				<p>{error.data}</p>
			</>
		);
	} else if (error instanceof Error) {
		return (
			<div>
				<h1>Error</h1>
				<p>{error.message}</p>
				<p>The stack trace is:</p>
				<pre>{error.stack}</pre>
			</div>
		);
	} else {
		return <h1>Unknown Error</h1>;
	}
}

export const Routes = () => {
	const router = createBrowserRouter([
		{
			path: "/",
			element: <Loading screen={<DashboardScreen />} />,
			ErrorBoundary: RootErrorBoundary,
			hydrateFallbackElement: <FullScreenLoader />,
		},
		{
			path: "/panel",
			children: [
				{
					path: "games",
					element: <Outlet />,
					children: [
						{
							index: true,
							loader: async () => {
								const response = await useServer<void, AdminGamesListResponse>({
									method: "GET",
									path: "/games/list",
								});

								if (response.result === "success") return response.data;

								return [];
							},
							element: <Loading screen={<GamesScreen />} />,
						},
						{
							path: ":gameId",
							loader: async ({ params }) => {
								const response = await useServer<AdminRequestWithGameId, AdminGameInfoResponse>({
									path: "/games/info",
									data: {
										gameId: Number(params.gameId),
									},
								});

								if (response.result === "success") return response.data;

								throw data(null, { status: 404 });
							},
							element: <Loading screen={<ManageGameScreen />} />,
						},
						{
							path: "new",
							element: <Loading screen={<NewGameScreen />} />,
						},
					],
				},
			],
			ErrorBoundary: RootErrorBoundary,
			hydrateFallbackElement: <FullScreenLoader />,
		},
	]);

	return <RouterProvider router={router} />;
};
