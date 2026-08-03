import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Home } from "lucide-react";
import { Link } from "react-router";

const NotFoundScreen = () => {
	return (
		<div className="relative flex h-dvh w-dvw items-center justify-center bg-[#0d1520] text-white p-6 overflow-hidden">
			<div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 text-center">
				<div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 mb-5 text-primary">
					<Ban className="size-7" />
				</div>
				<h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
				<p className="text-xs text-white/60 mb-6 leading-relaxed">
					The admin page or resource you are looking for does not exist or has been moved.
				</p>
				<div className="flex items-center justify-center gap-3">
					<Button
						variant="outline"
						asChild
						className="h-9 gap-2 rounded-lg border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/10">
						<Link to="..">
							<ArrowLeft className="size-4" />
							Go Back
						</Link>
					</Button>
					<Button
						asChild
						className="h-9 gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 text-xs font-bold text-primary-foreground transition-colors">
						<Link to="/">
							<Home className="size-4" />
							Dashboard
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NotFoundScreen;
