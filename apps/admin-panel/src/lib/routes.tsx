import { FullScreenLoader } from "@/screens/Loading.Screen";
import {
	AdminDatasetInfoResponse,
	AdminDatasetsListResponse,
	AdminGameInfoResponse,
	AdminGamesListResponse,
	AdminRequestWithDatasetId,
	AdminRequestWithGameId,
	AdminTelemetryResponse,
} from "@jetlag/shared-types";
import { Outlet, createBrowserRouter, data, isRouteErrorResponse, useRouteError } from "react-router";

import { RootLayout } from "@/components/RootLayout";
import NotFoundScreen from "@/screens/404.screen";
import DashboardScreen from "@/screens/Dashboard.screen";
import DatasetsScreen from "@/screens/Datasets.screen";
import GamesScreen from "@/screens/Games.screen";
import ManageDatasetScreen from "@/screens/ManageDataset.screen";
import ManageGameScreen from "@/screens/ManageGameScreen";
import NewDatasetScreen from "@/screens/NewDataset.screen";
import NewGameScreen from "@/screens/NewGame.screen";
import StatusScreen from "@/screens/Status.screen";
import { RouterProvider } from "react-router/dom";
import { useServer } from "./server";

function RootErrorBoundary() {
	const error = useRouteError();

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
			element: <RootLayout />,
			ErrorBoundary: RootErrorBoundary,
			hydrateFallbackElement: <FullScreenLoader />,
			children: [
				{
					path: "/",
					element: <DashboardScreen />,
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
											showPendingToast: false,
										});

										if (response.result === "success") return response.data;

										return [];
									},
									element: <GamesScreen />,
								},
								{
									path: ":gameId",
									loader: async ({ params }) => {
										const response = await useServer<AdminRequestWithGameId, AdminGameInfoResponse>(
											{
												path: "/games/info",
												data: {
													gameId: Number(params.gameId),
												},
												showPendingToast: false,
											},
										);

										if (response.result === "success") return response.data;

										throw data(null, { status: 404 });
									},
									element: <ManageGameScreen />,
								},
								{
									path: "new",
									loader: async () => {
										const response = await useServer<void, AdminDatasetsListResponse>({
											method: "GET",
											path: "/datasets/list",
											showPendingToast: false,
										});

										if (response.result === "success") return response.data;

										return [];
									},
									element: <NewGameScreen />,
								},
							],
						},
						{
							path: "datasets",
							element: <Outlet />,
							children: [
								{
									index: true,
									loader: async () => {
										const response = await useServer<void, AdminDatasetsListResponse>({
											method: "GET",
											path: "/datasets/list",
											showPendingToast: false,
										});

										if (response.result === "success") return response.data;

										return [];
									},
									element: <DatasetsScreen />,
								},
								{
									path: "new",
									element: <NewDatasetScreen />,
								},
								{
									path: ":datasetId",
									loader: async ({ params }) => {
										const response = await useServer<
											AdminRequestWithDatasetId,
											AdminDatasetInfoResponse
										>({
											path: "/datasets/info",
											method: "POST",
											data: {
												datasetId: Number(params.datasetId),
											},
											showPendingToast: false,
										});

										if (response.result === "success") return response.data;

										throw data(null, { status: 404 });
									},
									element: <ManageDatasetScreen />,
								},
							],
						},
						{
							path: "status",
							loader: async () => {
								const response = await useServer<void, AdminTelemetryResponse>({
									method: "GET",
									path: "/telemetry",
									showPendingToast: false,
								});

								if (response.result === "success") return response.data.logs;

								return [];
							},
							element: <StatusScreen />,
						},
					],
				},
			],
		},
	]);

	return <RouterProvider router={router} />;
};
