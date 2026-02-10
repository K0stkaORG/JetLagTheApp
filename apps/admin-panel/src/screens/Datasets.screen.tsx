import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLoaderData } from "react-router";
import { Map, MapPinned, Plus, Settings2 } from "lucide-react";

import { AdminDatasetsListResponse } from "@jetlag/shared-types";
import { Button } from "@/components/ui/button";
import ScreenTemplate from "@/components/ScreenTemplate";
import { Badge } from "@/components/ui/badge";

const DatasetsScreen = () => {
	const datasets = useLoaderData<AdminDatasetsListResponse>();

	return (
		<ScreenTemplate
			title="Datasets"
			backPath="/">
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative pb-20">
				{datasets.map((dataset) => (
					<Card
						key={dataset.id}
						className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-secondary/50 hover:border-l-secondary">
						<CardHeader>
							<div className="flex justify-between items-start">
								<div>
									<CardTitle className="text-xl mb-1">{dataset.name}</CardTitle>
									<CardDescription className="font-medium text-foreground/80 flex items-center gap-1">
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
						<CardContent>
							<div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
								<div className="bg-background p-2 rounded-md shadow-sm">
									<Map className="size-5 text-muted-foreground" />
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
										Latest Version
									</span>
									<span className="font-mono text-sm">{dataset.lastVersion}</span>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								asChild
								className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors"
								variant="outline">
								<Link to={`/panel/datasets/${dataset.id}`}>
									<Settings2 className="mr-2 size-4" />
									Manage Dataset
								</Link>
							</Button>
						</CardFooter>
					</Card>
				))}

				<Link
					to="/panel/datasets/new"
					className="group">
					<div className="h-full min-h-56 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary">
						<div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
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
