import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plane } from "lucide-react";
import { Link } from "react-router";

interface ScreenTemplateProps {
	title: string;
	backPath?: string;
	children: React.ReactNode;
	scrollable?: boolean;
	compactPadding?: boolean;
}

const ScreenTemplate = ({
	title,
	backPath,
	children,
	scrollable = true,
	compactPadding = false,
}: ScreenTemplateProps) => {
	return (
		<div className="bg-muted/30 flex h-dvh w-dvw flex-col">
			<header className="bg-card/80 sticky top-0 z-20 flex h-14 flex-none items-center gap-4 border-b px-6 backdrop-blur-sm">
				<Link
					to="/"
					className="text-primary flex items-center gap-2 text-lg font-bold transition-opacity hover:opacity-80">
					<div className="bg-primary/10 text-primary rounded-xl p-1.5">
						<Plane className="size-4" />
					</div>
					<span className="hidden md:inline">JetLag Admin</span>
				</Link>

				<div className="bg-border mx-2 hidden h-5 w-px md:block" />

				<h1 className="text-foreground text-base font-semibold">{title}</h1>
			</header>

			<div
				className={cn(`flex min-h-0 w-full flex-1 flex-col overflow-x-hidden`, {
					"overflow-hidden": !scrollable,
					"overflow-y-auto [scrollbar-gutter:stable]": scrollable,
				})}>
				<div
					className={cn(`mx-auto flex w-full max-w-7xl flex-1 flex-col gap-1`, {
						"min-h-full": scrollable,
						"h-full": !scrollable,
					})}>
					{backPath && (
						<div
							className={cn(`flex-none px-4 pt-3 md:px-8 md:pt-4 -mb-2`, {
								"px-3 pt-2 md:px-4 md:pt-2 -mb-1": compactPadding,
							})}>
							<Button
								variant="ghost"
								asChild
								className="text-muted-foreground hover:text-primary gap-1.5 px-2 pl-0 hover:bg-transparent cursor-pointer h-7 text-xs">
								<Link to={backPath}>
									<ArrowLeft className="size-3.5" />
									Back
								</Link>
							</Button>
						</div>
					)}

					<div
						className={cn(
							`animate-in fade-in zoom-in-95 flex h-full flex-1 flex-col p-4 duration-500 md:p-8`,
							{
								"overflow-hidden": !scrollable,
								"p-2 md:p-3": compactPadding,
							},
						)}>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ScreenTemplate;
