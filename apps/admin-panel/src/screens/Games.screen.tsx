import { AlarmClock, CloudCheck, Plus, Settings2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLoaderData } from "react-router";

import { AdminGamesListResponse } from "@jetlag/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GameTime from "@/components/GameTime";
import ScreenTemplate from "@/components/ScreenTemplate";

const GamesScreen = () => {
	const games = useLoaderData<AdminGamesListResponse>();

	return (
		<ScreenTemplate
			title="Games"
			backPath="/">
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative pb-20">
				{games.map((game) => (
					<Card
						key={game.id}
						className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary">
						<CardHeader>
							<div className="flex justify-between items-start">
								<div>
									<CardTitle className="text-xl mb-1">Game #{game.id}</CardTitle>
									<CardDescription className="font-medium text-foreground/80">
										{game.type}
									</CardDescription>
								</div>
								{game.serverLoaded ? (
									<Badge
										variant="default"
										className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20">
										<CloudCheck className="size-3 mr-1" />
										Running
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 border-orange-500/20">
										<AlarmClock className="size-3 mr-1" />
										Scheduled
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
								<span className="text-muted-foreground">Status</span>
								<span className="font-medium">
									<GameTime {...game.timeline} /> ({game.timeline.phase})
								</span>
							</div>
							<div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
								<span className="text-muted-foreground flex items-center gap-1">
									<Users className="size-3" /> Players
								</span>
								<span className="font-medium">
									{game.players.online} <span className="text-muted-foreground">/</span>{" "}
									{game.players.total}
								</span>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								asChild
								className="w-full group-hover:bg-primary/90"
								variant="outline">
								<Link to={`/panel/games/${game.id}`}>
									<Settings2 className="mr-2 size-4" />
									Manage Game
								</Link>
							</Button>
						</CardFooter>
					</Card>
				))}

				<Link
					to="/panel/games/new"
					className="group">
					<div className="h-full min-h-72 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary">
						<div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
							<Plus className="size-8" />
						</div>
						<div className="font-medium">Create New Game</div>
					</div>
				</Link>
			</div>
		</ScreenTemplate>
	);
};

export default GamesScreen;
