import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export const GlobalLoader = () => {
	const navigation = useNavigation();
	const isLoading = navigation.state === "loading" || navigation.state === "submitting";
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (isLoading) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
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

	return (
		<div className="pointer-events-none fixed top-0 right-0 left-0 z-100 h-1 bg-transparent">
			{progress > 0 && (
				<div
					className="bg-primary h-full shadow-[0_0_10px_var(--color-primary)] transition-all duration-300 ease-out"
					style={{ width: `${progress}%` }}
				/>
			)}
		</div>
	);
};
