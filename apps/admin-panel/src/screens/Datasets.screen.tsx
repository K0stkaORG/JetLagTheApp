import AdminCard from "@/components/AdminCard";
import ScreenTemplate from "@/components/ScreenTemplate";
import SearchHeader from "@/components/SearchHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { AdminDatasetsListResponse, DatasetState, formatGameType } from "@jetlag/shared-types";
import { AlertCircle, Database, Loader2, MapPinned, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router";

const FOOTER_FOR_STATE: Record<DatasetState, (id: number) => React.ReactNode> = {
	latest: (id) => (
		<Button
			asChild
			className="h-9 w-full gap-2 rounded-lg border border-white/15 bg-white/10 text-xs font-semibold text-white transition-colors hover:bg-white/20 hover:text-white">
			<Link to={`/panel/datasets/${id}`}>
				<Settings2 className="text-primary size-4" />
				Manage Dataset
			</Link>
		</Button>
	),
	parsing: (id) => (
		<Button
			asChild
			className="h-9 w-full gap-2 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white/80">
			<Link to={`/panel/datasets/${id}`}>
				<Loader2 className="text-primary size-4 animate-spin" />
				Processing…
			</Link>
		</Button>
	),
	errored: (id) => (
		<Button
			asChild
			className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 h-9 w-full gap-2 rounded-lg border text-xs font-semibold transition-colors">
			<Link to={`/panel/datasets/${id}`}>
				<AlertCircle className="size-4" />
				Processing Failed
			</Link>
		</Button>
	),
	outdated: (id) => (
		<Button
			asChild
			className="h-9 w-full gap-2 rounded-lg border border-white/15 bg-white/10 text-xs font-semibold text-white transition-colors hover:bg-white/20 hover:text-white">
			<Link to={`/panel/datasets/${id}`}>
				<Settings2 className="text-primary size-4" />
				Manage Dataset
			</Link>
		</Button>
	),
};

const DatasetsScreen = () => {
	const datasets = useLoaderData<AdminDatasetsListResponse>();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredDatasets = useMemo(() => {
		return datasets.filter((dataset) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				dataset.name.toLowerCase().includes(query) ||
				dataset.gameType.toLowerCase().includes(query) ||
				formatGameType(dataset.gameType).toLowerCase().includes(query)
			);
		});
	}, [datasets, searchQuery]);

	return (
		<ScreenTemplate
			title="Datasets"
			backPath="/">
			<div className="space-y-6 pb-20">
				{/* Search Header */}
				<SearchHeader
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					placeholder="Search..."
					newPath="/panel/datasets/new"
					newLabel="New Dataset"
				/>

				{/* Datasets Grid */}
				{filteredDatasets.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/4 py-16 text-center">
						<div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40">
							<Database className="size-6" />
						</div>
						<h3 className="text-base font-bold text-white">No datasets found</h3>
						<p className="mt-1 max-w-sm text-xs text-white/50">
							{searchQuery
								? "No datasets match your search terms."
								: "Create your first dataset to get started."}
						</p>
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
						{filteredDatasets.map((dataset) => (
							<AdminCard
								key={dataset.metadataId}
								title={dataset.name}
								icon={MapPinned}
								subtitle={`Game mode: ${formatGameType(dataset.gameType)}`}
								badge={
									<StatusBadge
										label={dataset.lastVersion != null ? `v${dataset.lastVersion}` : "—"}
									/>
								}
								footer={FOOTER_FOR_STATE[dataset.state](dataset.metadataId)}
							/>
						))}
					</div>
				)}
			</div>
		</ScreenTemplate>
	);
};

export default DatasetsScreen;
