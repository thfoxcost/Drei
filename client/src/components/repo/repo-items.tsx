import type { LucideIcon } from "lucide-react";
import { BookOpen, Scale, ShieldCheck, FileText, Package } from "lucide-react";
import type { RepoFile } from "#/types/repo";

export interface RepoItem {
	id: string;
	name: string;
	href: string;
	icon: LucideIcon;
	filePath?: string;
}

// `id` is the stable key used for persistence — keep it constant even if
// `name` or `href` change later, or saved preferences will silently reset.
const FILE_BASED_ITEMS: {
	id: string;
	name: string;
	href: string;
	icon: LucideIcon;
	filenames: string[];
}[] = [
	{
		id: "readme",
		name: "Readme",
		href: "/readme",
		icon: BookOpen,
		filenames: ["readme", "readme.md"],
	},
	{
		id: "license",
		name: "License",
		href: "/license",
		icon: Scale,
		filenames: ["license", "license.md"],
	},
	{
		id: "codeOfConduct",
		name: "Code of Conduct",
		href: "/code-of-conduct",
		icon: ShieldCheck,
		filenames: ["code_of_conduct", "code_of_conduct.md"],
	},
	{
		id: "contributing",
		name: "Contributing",
		href: "/contributing",
		icon: FileText,
		filenames: ["contributing", "contributing.md"],
	},
	{
		id: "security",
		name: "Security",
		href: "/security",
		icon: ShieldCheck,
		filenames: ["security", "security.md"],
	},
];

// Always-available (non-file-based) items.
const FIXED_ITEMS: RepoItem[] = [
	{ id: "size", name: "Size", href: "#", icon: Package },
];

export const REPO_ITEMS_STORAGE_KEY = "repo-panel:visible-items";

function findFile(files: RepoFile[], name: string): RepoFile | null {
	return files.find((f) => f.name.toLowerCase() === name.toLowerCase()) ?? null;
}

/**
 * Build the list of sidebar items that should be available for a given
 * repository tree. File-based items only appear when the corresponding
 * file exists in the repo. If both "foo" and "foo.md" exist the plain
 * variant wins (and .md is ignored). "Size" is always included.
 */
export function getAvailableItems(repoFiles: RepoFile[]): RepoItem[] {
	const available: RepoItem[] = [];

	for (const def of FILE_BASED_ITEMS) {
		const plain = def.filenames[0];
		const md = def.filenames[1];

		const match = findFile(repoFiles, plain) ?? (md ? findFile(repoFiles, md) : null);

		if (match) {
			available.push({
				id: def.id,
				name: def.name,
				href: def.href,
				icon: def.icon,
				filePath: match.path,
			});
		}
	}

	return [...available, ...FIXED_ITEMS];
}