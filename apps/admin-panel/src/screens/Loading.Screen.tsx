import { Loader2 } from "lucide-react";
import { useNavigation } from "react-router";

interface ScreenProps {
	screen: React.ReactNode;
}

export const FullScreenLoader = () => {
	return (
		<div className="w-dvw h-dvh flex flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm z-50">
			<div className="relative">
				<div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
				<div className="relative bg-card p-4 rounded-2xl shadow-lg border">
					<Loader2 className="size-8 animate-spin text-primary" />
				</div>
				<div className="absolute -top-1 -right-1">
					<span className="relative flex h-3 w-3">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
					</span>
				</div>
			</div>
			<p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
		</div>
	);
};

const Loading = ({ screen }: ScreenProps) => {
	const navigation = useNavigation();

	if (!!navigation.location) return <FullScreenLoader />;

	return screen;
};

export default Loading;
