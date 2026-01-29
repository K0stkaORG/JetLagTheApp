import Loading, { FullScreenLoader } from "@/screens/Loading.Screen";
import { Outlet, createBrowserRouter } from "react-router";

import { AdminGamesListResponse } from "@jetlag/shared-types";
import DashboardScreen from "@/screens/Dashboard.screen";
import GamesScreen from "@/screens/Games.screen";
import ManageGameScreen from "@/screens/ManageGameScreen";
import NewGameScreen from "@/screens/NewGame.screen";
import NotFoundScreen from "@/screens/404.screen";
import { RouterProvider } from "react-router/dom";
import { useServer } from "./server";

export const Routes = () => {
	const router = createBrowserRouter([
		{
			path: "/",
			element: <Loading screen={<DashboardScreen />} />,
			errorElement: <Loading screen={<NotFoundScreen />} />,
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
								return params.gameId;
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
			hydrateFallbackElement: <FullScreenLoader />,
		},
	]);

	return <RouterProvider router={router} />;
};
