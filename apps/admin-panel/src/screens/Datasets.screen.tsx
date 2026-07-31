import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Map, MapPinned, Plus, Settings2 } from "lucide-react";
import { Link, useLoaderData } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminDatasetsListResponse } from "@jetlag/shared-types";

const DatasetsScreen = () => {
	const datasets = useLoaderData<AdminDatasetsListResponse>();

	return (
		<ScreenTemplate
			title="Datasets"
			backPath="/">
			<div className="relative grid gap-6 pb-20 md:grid-cols-2 lg:grid-cols-3">
				{datasets.map((dataset) => (
					<Card
						key={dataset.id}
						className="group border-l-secondary/50 hover:border-l-secondary border-l-4 transition-all duration-300 hover:shadow-md">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="mb-1 text-xl">{dataset.name}</CardTitle>
									<CardDescription className="text-foreground/80 flex items-center gap-1 font-medium">
										<MapPinned className="size-3" />
										{dataset.gameType}
									</CardDescription>
								</div>
								<Badge
									variant="outline"
									className="font-mono">
									v.{dataset.lastVersion}
								</Badge>
							</div>
						</CardHeader>
						<CardContent
							className={cn({
								"opacity-0": dataset.lastVersion === 0,
							})}>
							<div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
								<div className="bg-background rounded-md p-2 shadow-sm">
									<Map className="text-muted-foreground size-5" />
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
										Latest Version
									</span>
									<span className="font-mono text-sm">{dataset.lastVersion}</span>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							{dataset.lastVersion > 0 ? (
								<Button
									asChild
									className="group-hover:bg-secondary group-hover:text-secondary-foreground w-full transition-colors"
									variant="outline">
									<Link to={`/panel/datasets/${dataset.id}`}>
										<Settings2 className="mr-2 size-4" />
										Manage Dataset
									</Link>
								</Button>
							) : (
								<Button
									className="group-hover:bg-secondary group-hover:text-secondary-foreground w-full transition-colors"
									variant="outline"
									disabled>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Processing...
								</Button>
							)}
						</CardFooter>
					</Card>
				))}

				<Link
					to="/panel/datasets/new"
					className="group">
					<div className="border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5 text-muted-foreground hover:text-primary flex h-full min-h-56 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all duration-300">
						<div className="bg-muted group-hover:bg-primary/10 rounded-full p-4 transition-colors">
							<Plus className="size-8" />
						</div>
						<div className="font-medium">Import new dataset</div>
					</div>
				</Link>
			</div>
		</ScreenTemplate>
	);
};

export default DatasetsScreen;
