import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
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
					size={size}>
					{children}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
					<AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => setDialogOpen(false)}>{cancelButtonText}</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={async () => {
							await onClick();
							setDialogOpen(false);
						}}>
						{confirmButtonText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmButton;
