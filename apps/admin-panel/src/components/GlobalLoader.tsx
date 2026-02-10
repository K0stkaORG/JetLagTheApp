import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export const GlobalLoader = () => {
	const navigation = useNavigation();
	const isLoading = navigation.state === "loading" || navigation.state === "submitting";
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (isLoading) {
			setProgress(10);
			const timer = setInterval(() => {
				setProgress((old) => {
					if (old >= 90) return old;
					return old + Math.random() * 10;
				});
			}, 200);
			return () => clearInterval(timer);
		} else {
			setProgress(100);
			const timer = setTimeout(() => setProgress(0), 500);
			return () => clearTimeout(timer);
		}
	}, [isLoading]);

	if (progress === 0) return null;

	return (
		<div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-transparent pointer-events-none">
			<div
				className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
};
