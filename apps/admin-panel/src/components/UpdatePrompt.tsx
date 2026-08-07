import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";
import { createContext, use, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./ui/button";

type UpdateContext = {
	needRefresh: boolean;
	popup: boolean;
	update: () => void;
	postponeUpdate: () => void;
};

const UpdateContext = createContext<UpdateContext>({} as UpdateContext);

export function UpdateProvider({ children }: { children?: React.ReactNode }) {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			// Periodically check for service worker updates (every 1 hour)
			if (r)
				setInterval(
					() => {
						r.update();
					},
					60 * 60 * 1000,
				);
		},
		onRegisterError(error) {
			console.error("Service worker registration error:", error);
		},
	});

	const [popup, setPopup] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPopup(needRefresh);
	}, [needRefresh]);

	const update = () => {
		updateServiceWorker(true);
		setPopup(false);
	};

	const postponeUpdate = () => {
		setPopup(false);
	};

	return (
		<UpdateContext.Provider value={{ needRefresh: true, popup, update, postponeUpdate }}>
			{children}
		</UpdateContext.Provider>
	);
}

const useUpdate = () => use(UpdateContext);

export function UpdatePrompt() {
	const { popup, update, postponeUpdate } = useUpdate();

	const handleOnOpenChange = (open: boolean) => {
		if (!open) postponeUpdate();
	};

	return (
		<AlertDialog
			open={popup}
			onOpenChange={handleOnOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="text-primary mb-1 flex items-center gap-2">
						<RefreshCw
							className="h-5 w-5 animate-spin"
							style={{ animationDuration: "3s" }}
						/>
						<AlertDialogTitle>Update Available</AlertDialogTitle>
					</div>
					<AlertDialogDescription>
						A new version of the Admin Panel is available. Please update to the latest version to enjoy new
						features and fixes.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={postponeUpdate}>Later</AlertDialogCancel>
					<AlertDialogAction onClick={update}>Update Now</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export const UpdateButton = () => {
	const { needRefresh, update } = useUpdate();

	if (!needRefresh) return null;

	return (
		<Button
			onClick={update}
			className="mr-1 flex h-auto items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold">
			<RefreshCw className="size-4" />
			<span>
				Update <span className="hidden md:inline">pending</span>
			</span>
		</Button>
	);
};
