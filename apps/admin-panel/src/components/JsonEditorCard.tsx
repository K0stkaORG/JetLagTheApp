import { Button } from "@/components/ui/button";
import { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import { cn } from "@/lib/utils";
import { AlertCircle, FileJson, LucideIcon, TextAlignStart } from "lucide-react";
import React from "react";
import { ZodType } from "zod";
import ValidatedJsonEditor from "./ValidatedJsonEditor";

export interface JsonEditorCardProps {
	title?: string;
	icon?: LucideIcon;
	error?: string | null;
	actions?: React.ReactNode;
	showFormatButton?: boolean;
	onFormat?: () => void;
	readOnly?: boolean;
	className?: string;
	children?: React.ReactNode;
	editorRef?: React.RefObject<ValidatedJsonEditorHandle | null>;
	value?: object | null;
	onChange?: (value: object | undefined) => void;
	onBlur?: () => void;
	zodSchema?: ZodType;
}

export function JsonEditorCard({
	title = "Dataset editor",
	icon: Icon = FileJson,
	error,
	actions,
	showFormatButton = true,
	onFormat,
	readOnly = false,
	className,
	children,
	editorRef,
	value,
	onChange,
	onBlur,
	zodSchema,
}: JsonEditorCardProps) {
	const handleFormat = () => {
		if (onFormat) {
			onFormat();
		} else if (editorRef?.current) {
			editorRef.current.format();
		}
	};

	return (
		<div
			className={cn(
				"bg-card flex min-h-112.5 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs lg:h-full lg:min-h-0",
				className,
			)}>
			<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
				<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
					<Icon className="size-4" />
					{title}
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{error && (
						<span className="text-destructive flex max-w-xs animate-pulse items-center gap-1.5 truncate text-xs font-semibold">
							<AlertCircle className="size-3.5 shrink-0" />
							{error}
						</span>
					)}
					<div className="flex items-center gap-2">
						{actions}
						{showFormatButton && !readOnly && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleFormat}>
								<TextAlignStart className="mr-1.5 size-3.5" />
								Format
							</Button>
						)}
					</div>
				</div>
			</div>

			{children ?? (
				<ValidatedJsonEditor
					ref={editorRef}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					zodSchema={zodSchema}
					readOnly={readOnly}
					className="flex-1 rounded-none border-0"
				/>
			)}
		</div>
	);
}

export default JsonEditorCard;
