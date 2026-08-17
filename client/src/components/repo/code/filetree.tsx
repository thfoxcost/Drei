import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Check,
	ChevronDown,
	File,
	Folder,
	GitBranch,
	PanelLeftClose,
	Plus,
	SearchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { type TreeDataItem, TreeView } from "#/components/tree-view";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import type { RepoFile } from "#/types/repo";

interface FiletreeProps {
	branches?: string[];
	defaultBranch?: string;
	files?: RepoFile[];
	currentBranch?: string;
	currentFilePath?: string;
	onToggleSidebar?: () => void;
}

function buildFileTree(files: RepoFile[]): TreeDataItem[] {
	const root: TreeDataItem[] = [];

	const fileEntries = files.filter((f) => f.type);

	const sorted = [...fileEntries].sort((a, b) => a.path.localeCompare(b.path));

	for (const file of sorted) {
		const parts = file.path.split("/");
		let current = root;

		for (let i = 0; i < parts.length - 1; i++) {
			const dirName = parts[i];
			let existing = current.find((n) => n.name === dirName && !!n.children);

			if (!existing) {
				existing = {
					id: parts.slice(0, i + 1).join("/"),
					name: dirName,
					icon: Folder,
					children: [],
				};
				current.push(existing);
			}

			current = existing.children!;
		}

		const fileName = parts[parts.length - 1];
		current.push({
			id: file.path,
			name: fileName,
			icon: File,
		});
	}

	return root;
}

function Filetree({
	branches = [],
	defaultBranch = "main",
	files = [],
	currentBranch = "main",
	currentFilePath,
	onToggleSidebar,
}: FiletreeProps) {
	const navigate = useNavigate();
	const { username, repo } = useParams({ strict: false });
	const owner = username as string;
	const repoName = repo as string;

	const [branchFilter, setBranchFilter] = useState("");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredBranches = branches.filter((branch) =>
		branch.toLowerCase().includes(branchFilter.toLowerCase()),
	);

	const handleBranchClick = (branch: string) => {
		setBranchFilter("");

		const currentUrl = window.location.pathname;
		const branchSegment = currentBranch;
		const branchPrefix = `/tree/${branchSegment}`;
		const blobPrefix = `/blob/${branchSegment}`;

		let restOfPath = "";
		if (currentUrl.includes(branchPrefix)) {
			restOfPath = currentUrl.split(branchPrefix)[1] || "";
		} else if (currentUrl.includes(blobPrefix)) {
			restOfPath = currentUrl.split(blobPrefix)[1] || "";
		}

		const prefix = currentUrl.includes(branchPrefix) ? "tree" : "blob";

		if (restOfPath && restOfPath !== "/") {
			navigate({
				to: `/$username/$repo/${prefix}/$branch/${restOfPath.replace(/^\//, "")}` as any,
				params: { username: owner, repo: repoName, branch },
			});
		} else {
			navigate({
				to: "/$username/$repo",
				params: { username: owner, repo: repoName },
			});
		}
	};

	const makeTreeItems = (
		items: TreeDataItem[],
		parentPath: string,
	): TreeDataItem[] => {
		return items.map((item) => {
			const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
			const hasChildren = !!item.children;

			return {
				...item,
				id: fullPath,
				...(hasChildren
					? {
							children: makeTreeItems(item.children ?? [], fullPath),
						}
					: {
							onClick: () =>
								navigate({
									to: "/$username/$repo/blob/$branch/$" as any,
									params: {
										username: owner,
										repo: repoName,
										branch: currentBranch,
										_splat: fullPath,
									},
								}),
						}),
			};
		});
	};

	const rawTree = buildFileTree(files);
	const fileTree = makeTreeItems(rawTree, "");

	const filteredTree = useMemo(() => {
		if (!searchQuery) return fileTree;

		const query = searchQuery.toLowerCase();
		const filter = (items: TreeDataItem[]): TreeDataItem[] => {
			return items
				.map((item) => {
					if (item.children) {
						const filteredChildren = filter(item.children);
						if (
							filteredChildren.length > 0 ||
							item.name.toLowerCase().includes(query) ||
							item.id.toLowerCase().includes(query)
						) {
							return { ...item, children: filteredChildren };
						}
						return null;
					}
					if (
						item.name.toLowerCase().includes(query) ||
						item.id.toLowerCase().includes(query)
					) {
						return item;
					}
					return null;
				})
				.filter(Boolean) as TreeDataItem[];
		};

		return filter(fileTree);
	}, [fileTree, searchQuery]);

	return (
		<div className="flex h-screen w-xs flex-col border-r">
			<div className="shrink-0 flex flex-col gap-2 px-4 pt-4">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={onToggleSidebar}>
						<PanelLeftClose />
					</Button>

					<span className="font-semibold">Files</span>
				</div>

				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="flex-1 justify-start">
								<GitBranch className="h-4 w-4" />
								{currentBranch}
								<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="start" className="w-64">
							<DropdownMenuLabel>Switch branch</DropdownMenuLabel>

							<div className="px-2 pb-2">
								<InputGroup>
									<InputGroupAddon>
										<SearchIcon className="h-3.5 w-3.5" />
									</InputGroupAddon>

									<InputGroupInput
										placeholder="Find a branch..."
										value={branchFilter}
										onChange={(e) => setBranchFilter(e.target.value)}
										className="text-xs"
									/>
								</InputGroup>
							</div>

							<DropdownMenuSeparator />

							{filteredBranches.length === 0 ? (
								<p className="p-2 text-xs text-muted-foreground">
									No branches found
								</p>
							) : (
								filteredBranches.map((branch) => (
									<DropdownMenuItem
										key={branch}
										onClick={() => handleBranchClick(branch)}
										className="flex items-center justify-between"
									>
										<span className="flex items-center gap-2">
											<GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
											{branch}
										</span>

										{branch === defaultBranch ? (
											<Badge
												variant="outline"
												className="h-4 px-1.5 text-[10px]"
											>
												Default
											</Badge>
										) : branch === currentBranch ? (
											<Check className="h-3.5 w-3.5 text-green-600" />
										) : null}
									</DropdownMenuItem>
								))
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button variant="outline" size="icon" disabled>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Go to file"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</InputGroup>
			</div>

			<div className="flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
				<TreeView data={filteredTree} initialSelectedItemId={currentFilePath} />
			</div>
		</div>
	);
}

export default Filetree;
