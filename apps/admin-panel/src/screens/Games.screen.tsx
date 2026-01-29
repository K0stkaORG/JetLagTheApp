import { AlarmClock, CloudCheck, PlusCircle, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLoaderData } from "react-router";

import { AdminGamesListResponse } from "@jetlag/shared-types";
import { Button } from "@/components/ui/button";
import GameTime from "@/components/GameTime";
import ScreenTemplate from "@/components/ScreenTemplate";

const GamesScreen = () => {
	const games = useLoaderData<AdminGamesListResponse>();

	return (
		<ScreenTemplate
			title="Games"
			backPath="/">
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
				{games.map((game) => (
					<Card key={game.id}>
						<CardHeader>
							<CardTitle>
								Game #{game.id} - {game.type}
							</CardTitle>
							<CardDescription className="flex items-center gap-1">
								{game.serverLoaded ? (
									<>
										<CloudCheck className="size-5" /> Server running
									</>
								) : (
									<>
										<AlarmClock className="size-5" /> Scheduled
									</>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div>
								Game time: <GameTime {...game.timeline} /> ({game.timeline.phase})
							</div>
							<div>
								Players online: {game.players.online} / {game.players.total}
							</div>
						</CardContent>
						<CardFooter>
							<Link
								to={`/panel/games/${game.id}`}
								className="ml-auto">
								<Button className="flex items-center gap-2">
									<Settings2 />
									Manage
								</Button>
							</Link>
						</CardFooter>
					</Card>
				))}
				<Link to="/panel/games/new">
					<div className="size-full min-h-48 rounded-lg text-gray-500 gap-2 flex items-center justify-center border-2 border-dashed border-gray-500">
						<PlusCircle className="size-8 " />
						Add new game
					</div>
				</Link>
			</div>
		</ScreenTemplate>
	);
};

export default GamesScreen;
