import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button, ButtonVariantProps } from "./ui/button";

import { useState } from "react";

type ConfirmButtonProps = ButtonVariantProps & {
	onClick: () => any;
	className?: string;
	children: React.ReactNode;
	confirmTitle?: string;
	confirmMessage: string;
	confirmButtonText?: string;
	cancelButtonText?: string;
};

const ConfirmButton = ({
	onClick,
	className,
	variant,
	size,
	children,
	confirmTitle = "Are you sure?",
	confirmMessage,
	confirmButtonText = "Confirm",
	cancelButtonText = "Cancel",
}: ConfirmButtonProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<AlertDialog
			open={dialogOpen}
			onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button
					className={className}
					variant={variant}
					size={size}
					onClick={() => setDialogOpen(true)}>
					{children}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-lg font-medium">{confirmTitle}</AlertDialogTitle>
					<AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<div className="flex items-center md:justify-end justify-center gap-2">
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}>
							{cancelButtonText}
						</Button>
						<Button
							variant="destructive"
							onClick={async () => {
								setDialogOpen(false);
								await onClick();
							}}>
							{confirmButtonText}
						</Button>
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmButton;
