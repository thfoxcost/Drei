import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	Check,
	ChevronDown,
	Code,
	Copy,
	FileArchive,
	GitBranch,
	SquareTerminal,
	Tag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RepoFile, TagInfo } from "#/types/repo";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
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
import { Spinner } from "../ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { FileSearch } from "./file-search";
import { RefSwitcher } from "./ref-switcher";

interface TableheaderProps {
	defaultBranch: string;
	activeBranch?: string;
	refKind?: "branch" | "tag";
	owner: string;
	repo: string;
	branches: string[];
	nBranches: number;
	tags: TagInfo[] | null;
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
	refKind = "branch",
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
	const queryClient = useQueryClient();
	const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const currentBranch = activeBranch || defaultBranch;

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

	const handleTagClick = (tag: string) => {
		navigate({
			to: "/$username/$repo/tag/$tagName",
			params: { username: owner, repo, tagName: tag },
		});
	};

	const handleDeleteBranch = async () => {
		if (!branchToDelete) return;
		setIsDeleting(true);

		try {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/branches/${encodeURIComponent(branchToDelete)}`,
				{ method: "DELETE", credentials: "include" },
			);

			const result = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(
					result?.error || result?.message || "Failed to delete branch",
				);
			}

			toast.success(`Branch "${branchToDelete}" deleted`);
			const deletedCurrent = branchToDelete === currentBranch;
			setBranchToDelete(null);
			await queryClient.invalidateQueries({
				queryKey: ["repo", owner, repo],
			});

			if (deletedCurrent) {
				navigate({
					to: "/$username/$repo",
					params: { username: owner, repo },
				});
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDownload = async (format: "zip" | "tar.gz") => {
		const url = `/api/repos/${owner}/${repo}/download?format=${format}&ref=${encodeURIComponent(currentBranch)}`;

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
				{/* Branch/tag switcher */}
				<RefSwitcher
					currentRef={currentBranch}
					currentKind={refKind}
					defaultBranch={defaultBranch}
					branches={branches}
					tags={tags ?? []}
					onSelectBranch={handleBranchClick}
					onSelectTag={handleTagClick}
					onDeleteBranch={setBranchToDelete}
				/>

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
								<DropdownMenuItem
									key={tag.name}
									onClick={() => handleTagClick(tag.name)}
									className="flex items-center gap-2"
								>
									<Tag className="h-3.5 w-3.5 text-muted-foreground" />
									{tag.name}
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

			<Dialog
				open={branchToDelete !== null}
				onOpenChange={(open) => {
					if (!open && !isDeleting) setBranchToDelete(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete &quot;{branchToDelete}&quot;?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will permanently delete the{" "}
							<span className="font-medium text-foreground">
								{branchToDelete}
							</span>{" "}
							branch and it cannot be recovered.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setBranchToDelete(null)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteBranch}
							disabled={isDeleting}
						>
							{isDeleting ? <Spinner /> : "Delete branch"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default Tableheader;
