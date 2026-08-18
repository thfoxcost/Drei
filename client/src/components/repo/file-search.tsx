import { useNavigate } from "@tanstack/react-router";
import { File, Folder, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { RepoFile } from "#/types/repo";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

interface FileSearchProps {
	files: RepoFile[];
	owner: string;
	repo: string;
	branch: string;
}

export function FileSearch({ files, owner, repo, branch }: FileSearchProps) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);

	const handleSelect = (file: RepoFile) => {
		setOpen(false);

		if (file.type) {
			navigate({
				to: "/$username/$repo/blob/$branch/$" as any,
				params: {
					username: owner,
					repo,
					branch,
					_splat: file.path,
				},
			});
		} else {
			navigate({
				to: "/$username/$repo/tree/$branch/$" as any,
				params: {
					username: owner,
					repo,
					branch,
					_splat: file.path,
				},
			});
		}
	};

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				variant="outline"
				className="max-w-xs"
			>
				<SearchIcon className="size-4" />
				<span className="truncate">Search files...</span>
				<Kbd className="ml-auto px-2">/</Kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent">
					<CommandInput
						placeholder="Search files..."
						className="placeholder:text-muted-foreground"
					/>
					<CommandList>
						<CommandEmpty>No files found</CommandEmpty>
						<CommandGroup heading="Files">
							{files.map((file) => (
								<CommandItem
									key={file.path}
									value={file.path}
									className="gap-2.5"
									onSelect={() => handleSelect(file)}
								>
									{file.type ? (
										<File className="size-4 shrink-0" />
									) : (
										<Folder className="size-4 shrink-0" />
									)}
									<span className="truncate">{file.path}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
