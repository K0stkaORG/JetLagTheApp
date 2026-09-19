import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router";

interface FilterOption<T extends string> {
	id: T;
	label: string;
	count?: number;
}

interface SearchHeaderProps<T extends string> {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	placeholder?: string;
	filterValue?: T;
	onFilterChange?: (value: T) => void;
	filterOptions?: FilterOption<T>[];
	newPath?: string;
	newLabel?: string;
}

export function SearchHeader<T extends string>({
	searchQuery,
	onSearchChange,
	placeholder = "Search...",
	filterValue,
	onFilterChange,
	filterOptions,
	newPath,
	newLabel = "New Item",
}: SearchHeaderProps<T>) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-wrap items-center gap-3">
				{/* Search Input */}
				<div className="relative w-full sm:w-80">
					<Search className="absolute top-2.5 left-3 size-4 text-white/40" />
					<Input
						placeholder={placeholder}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="focus-visible:border-primary/50 focus-visible:ring-primary/40 h-9 rounded-lg border-white/10 bg-white/5 pl-9 text-xs text-white placeholder:text-white/35"
					/>
				</div>

				{/* Filter Pills */}
				{filterOptions && onFilterChange && (
					<div className="flex w-full items-center rounded-lg border border-white/10 bg-white/5 p-1 text-xs font-semibold sm:w-auto">
						{filterOptions.map((opt) => {
							const isActive = filterValue === opt.id;
							return (
								<button
									key={opt.id}
									type="button"
									onClick={() => onFilterChange(opt.id)}
									className={`cursor-pointer rounded-md px-3 py-1 transition-colors ${
										isActive
											? "border-primary/30 bg-primary/20 text-primary border shadow-xs"
											: "text-white/50 hover:text-white"
									}`}>
									{opt.label} {opt.count !== undefined && `(${opt.count})`}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* New Action CTA Button */}
			{newPath && (
				<Button
					asChild
					className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-2 rounded-lg px-4 text-xs font-bold shadow-xs transition-colors">
					<Link to={newPath}>
						<Plus
							className="size-4"
							strokeWidth={2.5}
						/>
						{newLabel}
					</Link>
				</Button>
			)}
		</div>
	);
}

export default SearchHeader;
