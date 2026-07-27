import { Loader2 } from "lucide-react";
import { useNavigation } from "react-router";

interface ScreenProps {
	screen: React.ReactNode;
}

export const FullScreenLoader = () => {
	return (
		<div className="bg-background/50 z-50 flex h-dvh w-dvw flex-col items-center justify-center gap-4 backdrop-blur-sm">
			<div className="relative">
				<div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
				<div className="bg-card relative rounded-2xl border p-4 shadow-lg">
					<Loader2 className="text-primary size-8 animate-spin" />
				</div>
				<div className="absolute -top-1 -right-1">
					<span className="relative flex h-3 w-3">
						<span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
						<span className="bg-primary relative inline-flex h-3 w-3 rounded-full"></span>
					</span>
				</div>
			</div>
			<p className="text-muted-foreground animate-pulse text-sm font-medium">Loading...</p>
		</div>
	);
};

const Loading = ({ screen }: ScreenProps) => {
	const navigation = useNavigation();

	if (navigation.location) return <FullScreenLoader />;

	return screen;
};

export default Loading;
