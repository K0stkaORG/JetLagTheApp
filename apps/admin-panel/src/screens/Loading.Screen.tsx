import { Loader2 } from "lucide-react";
import { useNavigation } from "react-router";

interface ScreenProps {
	screen: React.ReactNode;
}

export const FullScreenLoader = () => {
	return (
		<div className="w-dvw h-dvh flex items-center justify-center">
			<Loader2 className="animate-spin" />
		</div>
	);
};

const Loading = ({ screen }: ScreenProps) => {
	const navigation = useNavigation();

	if (!!navigation.location) return <FullScreenLoader />;

	return screen;
};

export default Loading;
