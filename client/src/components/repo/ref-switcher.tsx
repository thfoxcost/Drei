import {
	Check,
	ChevronDown,
	GitBranch,
	SearchIcon,
	Tag,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import type { TagInfo } from "#/types/repo";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "../ui/input-group";

export type RefKind = "branch" | "tag";

interface RefSwitcherProps {
	currentRef: string;
	currentKind: RefKind;
	defaultBranch: string;
	branches: string[];
	tags: TagInfo[];
	onSelectBranch: (branch: string) => void;
	onSelectTag: (tag: string) => void;
	onDeleteBranch?: (branch: string) => void;
}

function matches(query: string, value: string) {
	return value.toLowerCase().includes(query.toLowerCase());
}

export function RefSwitcher({
	currentRef,
	currentKind,
	defaultBranch,
	branches,
	tags,
	onSelectBranch,
	onSelectTag,
	onDeleteBranch,
}: RefSwitcherProps) {
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState("");

	const filteredBranches = branches.filter((b) => matches(filter, b));
	const filteredTags = tags.filter((t) => matches(filter, t.name));

	const selectBranch = (branch: string) => {
		setFilter("");
		setOpen(false);
		onSelectBranch(branch);
	};

	const selectTag = (tag: string) => {
		setFilter("");
		setOpen(false);
		onSelectTag(tag);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="align-center justify-center">
					{currentKind === "tag" ? (
						<Tag className="h-4 w-4" />
					) : (
						<GitBranch className="h-4 w-4" />
					)}
					{currentRef}
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel>Switch branch or tag</DropdownMenuLabel>
				<div className="px-2 pb-2">
					<InputGroup>
						<InputGroupAddon>
							<SearchIcon className="h-3.5 w-3.5" />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Find a branch or tag..."
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className="text-xs"
						/>
					</InputGroup>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Branches
				</DropdownMenuLabel>
				{filteredBranches.length === 0 ? (
					<p className="text-xs text-muted-foreground p-2">
						No branches found
					</p>
				) : (
					filteredBranches.map((branch) => (
						<DropdownMenuItem
							key={branch}
							onClick={() => selectBranch(branch)}
							className="group flex items-center justify-between"
						>
							<span className="flex items-center gap-2">
								<GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
								{branch}
							</span>
							<span className="flex items-center gap-1.5">
								{branch === defaultBranch ? (
									<Badge
										variant="outline"
										className="h-4 px-1.5 text-[10px]"
									>
										Default
									</Badge>
								) : branch === currentRef && currentKind === "branch" ? (
									<Check className="h-3.5 w-3.5 text-green-600" />
								) : null}
								{onDeleteBranch && branch !== defaultBranch && (
									<button
										type="button"
										aria-label={`Delete branch ${branch}`}
										title={`Delete branch ${branch}`}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											setOpen(false);
											onDeleteBranch(branch);
										}}
										className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</span>
						</DropdownMenuItem>
					))
				)}
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Tags
				</DropdownMenuLabel>
				{filteredTags.length === 0 ? (
					<p className="text-xs text-muted-foreground p-2">No tags found</p>
				) : (
					filteredTags.map((tag) => (
						<DropdownMenuItem
							key={tag.name}
							onClick={() => selectTag(tag.name)}
							className="group flex items-center justify-between"
						>
							<span className="flex items-center gap-2">
								<Tag className="h-3.5 w-3.5 text-muted-foreground" />
								{tag.name}
							</span>
							{tag.name === currentRef && currentKind === "tag" ? (
								<Check className="h-3.5 w-3.5 text-green-600" />
							) : (
								<span className="text-[10px] text-muted-foreground">
									{tag.shortSha}
								</span>
							)}
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
