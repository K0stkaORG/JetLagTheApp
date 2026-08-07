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
import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			// Periodically check for service worker updates (every 1 hour)
			if (r)
				setInterval(() => {
					r.update();
				}, 1000);
		},
		onRegisterError(error) {
			console.error("Service worker registration error:", error);
		},
	});

	const close = () => {
		setNeedRefresh(false);
	};

	const handleUpdate = () => {
		updateServiceWorker(true);
	};

	return (
		<AlertDialog
			open={needRefresh}
			onOpenChange={setNeedRefresh}>
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
					<AlertDialogCancel onClick={close}>Later</AlertDialogCancel>
					<AlertDialogAction onClick={handleUpdate}>Update Now</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
