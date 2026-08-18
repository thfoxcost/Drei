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
import { toast } from "sonner";
import { Badge } from "../ui/badge";
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

import { FileSearch } from "./file-search";
import type { RepoFile } from "#/types/repo";

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
	readme?: string;
	files?: RepoFile[];
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
	readme,
	files = [],
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
				to: "/$username/$repo/branch/$branchName",
				params: { username: owner, repo, branchName: branch },
			});
		}
	};

	const handleDownload = async (format: "zip" | "tar.gz") => {
		const url = `${import.meta.env.VITE_BACKEND_URL}/api/repos/${owner}/${repo}/download?format=${format}&branch=${encodeURIComponent(currentBranch)}`;

		try {
			const res = await fetch(url);

			if (!res.ok) {
				let message = "Failed to download archive";
				try {
					const data = (await res.json()) as { error?: string };
					if (data.error) message = data.error;
				} catch {
					// non-JSON error body
				}
				throw new Error(message);
			}

			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = `${repo}.${format}`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	};

	const handleDownloadReadme = () => {
		if (!readme) {
			toast.error("No README found in this repository");
			return;
		}

		const blob = new Blob([readme], { type: "text/markdown;charset=utf-8" });
		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = "README.md";
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(objectUrl);
	};

	const handleOpenInVSCode = () => {
		const uri = `vscode://vscode.git/clone?url=${encodeURIComponent(cloneUrl)}`;

		let opened = false;
		const onBlur = () => {
			opened = true;
			window.removeEventListener("blur", onBlur);
		};

		window.addEventListener("blur", onBlur);

		try {
			window.location.href = uri;
		} catch {
			window.removeEventListener("blur", onBlur);
		}

		window.setTimeout(() => {
			window.removeEventListener("blur", onBlur);

			if (!opened) {
				toast.error(
					"VS Code doesn't appear to be installed, or the vscode:// link could not be opened",
				);
			}
		}, 2000);
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
									{branch === defaultBranch ? (
										<Badge variant="outline" className="h-4 px-1.5 text-[10px]">
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
				<FileSearch
					files={files}
					owner={owner}
					repo={repo}
					branch={currentBranch}
				/>

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
							<DropdownMenuItem onClick={handleOpenInVSCode}>
								<img
									src="/icons/vscode.svg"
									alt="vscode icon"
									className="h-4 w-4 grayscale"
								/>
								<span className=" hover:underline text-sm text-foreground">
									Open with VS Code
								</span>
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

							<DropdownMenuItem onClick={() => handleDownload("zip")}>
								<FileArchive className="size-4" />
								<span className=" hover:underline text-sm text-foreground">
									Download ZIP
								</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => handleDownload("tar.gz")}>
								<FileArchive className="size-4" />
								<span className=" hover:underline text-sm text-foreground">
									Download TAR.GZ
								</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={handleDownloadReadme}>
								<img
									src="/icons/readme.svg"
									alt="drei icon"
									className="h-4.5 w-4.5 grayscale"
								/>
								<span className=" hover:underline text-sm text-foreground">
									Download README
								</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export default Tableheader;
