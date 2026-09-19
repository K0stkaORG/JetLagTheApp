import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Home } from "lucide-react";
import { Link } from "react-router";

const NotFoundScreen = () => {
	return (
		<div className="relative flex h-dvh w-dvw items-center justify-center overflow-hidden bg-[#0d1520] p-6 text-white">
			<div className="bg-card relative z-10 w-full max-w-md rounded-2xl border border-white/10 p-8 text-center">
				<div className="border-primary/30 bg-primary/10 text-primary mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border">
					<Ban className="size-7" />
				</div>
				<h1 className="mb-2 text-xl font-bold text-white">Page Not Found</h1>
				<p className="mb-6 text-xs leading-relaxed text-white/60">
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
						className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 gap-2 rounded-lg px-4 text-xs font-bold transition-colors">
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
