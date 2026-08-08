import { useNavigate } from "@tanstack/react-router";
import {
	Check,
	ChevronDown,
	Code,
	Copy,
	FileArchive,
	GitBranch,
	SearchIcon,
	SquareTerminal,
	Tag,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Field } from "../ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "../ui/input-group";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface TableheaderProps {
	defaultBranch: string;
	activeBranch?: string;
	owner: string;
	repo: string;
	branches: string[];
	nBranches: number;
	tags: string[] | null;
	nTags: number;
	cloneUrl: string;
}

function CloneUrlField({ url }: { url?: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		if (!url) return;
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	return (
		<Field>
			<InputGroup>
				<InputGroupInput
					readOnly
					value={url ?? "Coming soon"}
					className="font-mono text-xs"
				/>
				{url && (
					<InputGroupAddon align="inline-end">
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={handleCopy}
							aria-label="Copy clone URL"
						>
							{copied ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</InputGroupAddon>
				)}
			</InputGroup>
		</Field>
	);
}

function Tableheader({
	defaultBranch,
	activeBranch,
	owner,
	repo,
	branches,
	nBranches,
	tags,
	nTags,
	cloneUrl,
}: TableheaderProps) {
	const navigate = useNavigate();
	const [branchFilter, setBranchFilter] = useState("");

	const currentBranch = activeBranch || defaultBranch;

	const filteredBranches = branches.filter((b) =>
		b.toLowerCase().includes(branchFilter.toLowerCase()),
	);

	const handleBranchClick = (branch: string) => {
		if (branch === defaultBranch) {
			navigate({
				to: "/$username/$repo",
				params: { username: owner, repo },
			});
		} else {
			navigate({
				to: "/$username/$repo/tree/$branch",
				params: { branch },
			});
		}
	};

	return (
		<div className="flex flex-row items-center gap-2 justify-between">
			<div className="flex flex-row gap-3">
				{/* Branch switcher */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="align-center justify-center">
							<GitBranch className="h-4 w-4" />
							{currentBranch}
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
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
							<p className="text-xs text-muted-foreground p-2">
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
									{branch === currentBranch && (
										<Check className="h-3.5 w-3.5 text-green-600" />
									)}
								</DropdownMenuItem>
							))
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Branches list */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="align-center justify-center">
							<GitBranch className="h-4 w-4 text-muted-foreground" />
							<span className="font-bold">{nBranches}</span>
							<span className="text-muted-foreground">Branches</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-56">
						<DropdownMenuLabel>Branches</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{branches.length === 0 ? (
							<p className="text-xs text-muted-foreground p-2">No branches</p>
						) : (
							branches.map((branch) => (
								<DropdownMenuItem
									key={branch}
									onClick={() => handleBranchClick(branch)}
									className="flex items-center gap-2"
								>
									<GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
									{branch}
									{branch === defaultBranch && (
										<span className="ml-auto text-xs text-muted-foreground">
											default
										</span>
									)}
								</DropdownMenuItem>
							))
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Tags list */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="align-center justify-center">
							<Tag className="h-4 w-4 text-muted-foreground" />
							<span className="font-bold">{nTags}</span>
							<span className="text-muted-foreground">Tags</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-56">
						<DropdownMenuLabel>Tags</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{!tags || tags.length === 0 ? (
							<p className="text-xs text-muted-foreground p-2">No tags</p>
						) : (
							tags.map((tag) => (
								<DropdownMenuItem key={tag} className="flex items-center gap-2">
									<Tag className="h-3.5 w-3.5 text-muted-foreground" />
									{tag}
								</DropdownMenuItem>
							))
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex flex-row gap-2 items-center">
				<Field className="max-w-xs">
					<InputGroup>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
						<InputGroupInput placeholder="Search..." />
					</InputGroup>
				</Field>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="inline-flex items-center justify-center gap-1"
						>
							<span>Add file</span>
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<p className="text-xs text-muted-foreground p-2">
							Open coming soon
						</p>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700">
							<Code className="h-4 w-4" />
							<span>Clone</span>
							<ChevronDown className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-80 p-2">
						<DropdownMenuLabel className="flex items-bottom gap-1 px-0 pb-2">
							<SquareTerminal className="h-4.5 w-4.5" />
							<span className="text-sm font-medium text-muted-foreground">
								<span className="muted-foreground text-sm">Clone</span>
							</span>
						</DropdownMenuLabel>
						<Tabs defaultValue="http" className="w-full">
							<div className="border-b border-border w-full">
								<TabsList variant="line">
									<TabsTrigger value="http">HTTP</TabsTrigger>
									<TabsTrigger value="ssh">SSH</TabsTrigger>
									<TabsTrigger value="cli">CLI</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent value="http" className="mt-1">
								<CloneUrlField url={cloneUrl} />
							</TabsContent>
							<TabsContent value="ssh" className="mt-1">
								<CloneUrlField url="SSH Coming Soon" />
							</TabsContent>
							<TabsContent value="cli" className="mt-1">
								<CloneUrlField url="CLI Coming Soon" />
							</TabsContent>
						</Tabs>
						<DropdownMenuGroup className="mt-2">
							<DropdownMenuItem disabled>
								<img
									src="/icons/vscode.svg"
									alt="vscode icon"
									className="h-4 w-4 grayscale"
								/>
								<a
									href="https://code.visualstudio.com/"
									className=" hover:underline text-sm text-foreground"
								>
									Open with VS Code
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem disabled>
								<img
									src="/logo-dark.svg"
									alt="drei icon"
									className="h-5 w-5 grayscale"
								/>
								<a
									href="https://code.visualstudio.com/"
									className=" hover:underline text-sm text-foreground"
								>
									Open with Drei Desktop
								</a>
							</DropdownMenuItem>

							<Separator className="my-1" />

							<DropdownMenuItem disabled>
								<FileArchive className="size-4" />
								<a
									href="https://code.visualstudio.com/"
									className=" hover:underline text-sm text-foreground"
								>
									Download ZIP
								</a>
							</DropdownMenuItem>

							<DropdownMenuItem disabled>
								<FileArchive className="size-4" />
								<a
									href="https://code.visualstudio.com/"
									className=" hover:underline text-sm text-foreground"
								>
									Download TAR.GZ
								</a>
							</DropdownMenuItem>

							<DropdownMenuItem disabled>
								<img
									src="/icons/readme.svg"
									alt="drei icon"
									className="h-4.5 w-4.5 grayscale"
								/>
								<a
									href="https://code.visualstudio.com/"
									className=" hover:underline text-sm text-foreground"
								>
									Download README
								</a>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export default Tableheader;
