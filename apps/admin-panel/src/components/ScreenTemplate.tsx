import { ArrowLeft, Plane } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface ScreenTemplateProps {
	title: string;
	backPath?: string;
	children: React.ReactNode;
	scrollable?: boolean;
}

const ScreenTemplate = ({ title, backPath, children, scrollable = true }: ScreenTemplateProps) => {
	return (
		<div className="w-dvw h-dvh flex flex-col bg-muted/30">
			<header className="h-16 border-b bg-card/80 backdrop-blur-sm px-6 flex items-center gap-4 flex-none sticky top-0 z-20">
				<Link
					to="/"
					className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity">
					<div className="p-2 bg-primary/10 rounded-xl text-primary">
						<Plane className="size-5" />
					</div>
					<span className="hidden md:inline">JetLag Admin</span>
				</Link>

				<div className="h-6 w-px bg-border mx-2 hidden md:block" />

				<h1 className="font-semibold text-lg text-foreground">{title}</h1>
			</header>

			<div
				className={`flex-1 flex flex-col min-h-0 w-full overflow-x-hidden ${scrollable ? "overflow-y-auto [scrollbar-gutter:stable]" : "overflow-hidden"}`}>
				<div
					className={`w-full max-w-7xl mx-auto flex flex-col flex-1 gap-2 ${scrollable ? "min-h-full" : "h-full"}`}>
					{backPath && (
						<div className="flex-none -mb-2 px-4 md:px-8 pt-4 md:pt-8">
							<Button
								variant="ghost"
								asChild
								className="pl-0 gap-2 text-muted-foreground hover:text-primary hover:bg-transparent px-2">
								<Link to={backPath}>
									<ArrowLeft className="size-4" />
									Back
								</Link>
							</Button>
						</div>
					)}

					<div className={`flex-1 flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500`}>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ScreenTemplate;
