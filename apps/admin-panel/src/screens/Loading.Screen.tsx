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
				<Loader2 className="text-primary size-8 animate-spin" />
			</div>
			<p className="text-muted-foreground animate-pulse text-center text-sm font-medium">Loading...</p>
		</div>
	);
};

const Loading = ({ screen }: ScreenProps) => {
	const navigation = useNavigation();

	if (navigation.location) return <FullScreenLoader />;

	return screen;
};

export default Loading;
