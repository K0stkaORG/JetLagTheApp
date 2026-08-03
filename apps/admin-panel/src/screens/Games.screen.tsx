import AdminCard from "@/components/AdminCard";
import GameTime from "@/components/GameTime";
import ScreenTemplate from "@/components/ScreenTemplate";
import SearchHeader from "@/components/SearchHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { AdminGamesListResponse, formatGameType } from "@jetlag/shared-types";
import { Clock, Gamepad2, Settings2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router";

type StatusFilter = "all" | "running" | "offline";

const GamesScreen = () => {
	const games = useLoaderData<AdminGamesListResponse>();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	const filteredGames = useMemo(() => {
		return games.filter((game) => {
			const search = searchQuery.trim().toLowerCase();
			const matchesSearch =
				game.id.toString().includes(search) ||
				game.type.toLowerCase().includes(search) ||
				formatGameType(game.type).toLowerCase().includes(search) ||
				(game.dataset?.name && game.dataset.name.toLowerCase().includes(search));

			if (!matchesSearch) return false;

			if (statusFilter === "running") return game.serverLoaded;
			if (statusFilter === "offline") return !game.serverLoaded;
			return true;
		});
	}, [games, searchQuery, statusFilter]);

	const filterOptions = [
		{ id: "all" as StatusFilter, label: "All", count: games.length },
		{ id: "running" as StatusFilter, label: "Running", count: games.filter((g) => g.serverLoaded).length },
		{ id: "offline" as StatusFilter, label: "Offline", count: games.filter((g) => !g.serverLoaded).length },
	];

	return (
		<ScreenTemplate
			title="Games"
			backPath="/">
			<div className="space-y-6 pb-20">
				{/* Search & Filter Header */}
				<SearchHeader
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					placeholder="Search..."
					filterValue={statusFilter}
					onFilterChange={setStatusFilter}
					filterOptions={filterOptions}
					newPath="/panel/games/new"
					newLabel="New Game"
				/>

				{/* Games Grid */}
				{filteredGames.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/4 py-16 text-center">
						<div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40">
							<Gamepad2 className="size-6" />
						</div>
						<h3 className="text-base font-bold text-white">No games found</h3>
						<p className="mt-1 max-w-sm text-xs text-white/50">
							{searchQuery || statusFilter !== "all"
								? "No game sessions match your search filters."
								: "Create your first game to get started."}
						</p>
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
						{filteredGames.map((game) => (
							<AdminCard
								key={game.id}
								icon={Gamepad2}
								title={`${formatGameType(game.type)}${game.dataset?.name ? `: ${game.dataset.name}` : ""}`}
								badge={<StatusBadge variant={game.serverLoaded ? "running" : "offline"} />}
								footer={
									<Button
										asChild
										className="h-9 flex-1 gap-2 rounded-lg border border-white/15 bg-white/10 text-xs font-semibold text-white transition-colors hover:bg-white/20 hover:text-white">
										<Link to={`/panel/games/${game.id}`}>
											<Settings2 className="text-primary size-4" />
											Manage Game
										</Link>
									</Button>
								}>
								<div className="space-y-2 text-xs">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5 font-medium text-white/50">
											<Clock className="text-primary size-3.5" />
											Game time
										</span>
										<span className="font-semibold text-white">
											<GameTime {...game.timeline} />{" "}
											<span className="font-normal text-white/40">({game.timeline.phase})</span>
										</span>
									</div>

									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5 font-medium text-white/50">
											<Users className="text-primary size-3.5" /> Players
										</span>
										<span className="font-semibold text-white">
											{game.players.online} online{" "}
											<span className="font-normal text-white/40">
												/ {game.players.total} total
											</span>
										</span>
									</div>
								</div>
							</AdminCard>
						))}
					</div>
				)}
			</div>
		</ScreenTemplate>
	);
};

export default GamesScreen;
