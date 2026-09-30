import type { LucideIcon } from "lucide-react";
import { BookOpen, FileText, Package, Scale, ShieldCheck } from "lucide-react";
import type { RepoFile } from "#/types/repo";

export interface RepoItem {
	id: string;
	/** i18n key for the human-readable label; resolved at render time. */
	nameKey: string;
	href: string;
	icon: LucideIcon;
	filePath?: string;
}

// `id` is the stable key used for persistence — keep it constant even if
// `nameKey` or `href` change later, or saved preferences will silently reset.
const FILE_BASED_ITEMS: {
	id: string;
	nameKey: string;
	href: string;
	icon: LucideIcon;
	filenames: string[];
}[] = [
	{
		id: "readme",
		nameKey: "repo.sidebar.readme",
		href: "/readme",
		icon: BookOpen,
		filenames: ["readme", "readme.md"],
	},
	{
		id: "license",
		nameKey: "repo.sidebar.license",
		href: "/license",
		icon: Scale,
		filenames: ["license", "license.md"],
	},
	{
		id: "codeOfConduct",
		nameKey: "repo.sidebar.codeOfConduct",
		href: "/code-of-conduct",
		icon: ShieldCheck,
		filenames: ["code_of_conduct", "code_of_conduct.md"],
	},
	{
		id: "contributing",
		nameKey: "repo.sidebar.contributing",
		href: "/contributing",
		icon: FileText,
		filenames: ["contributing", "contributing.md"],
	},
	{
		id: "security",
		nameKey: "repo.sidebar.security",
		href: "/security",
		icon: ShieldCheck,
		filenames: ["security", "security.md"],
	},
];

// Always-available (non-file-based) items.
const FIXED_ITEMS: RepoItem[] = [
	{ id: "size", nameKey: "repo.sidebar.size", href: "#", icon: Package },
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

		const match =
			findFile(repoFiles, plain) ?? (md ? findFile(repoFiles, md) : null);

		if (match) {
			available.push({
				id: def.id,
				nameKey: def.nameKey,
				href: def.href,
				icon: def.icon,
				filePath: match.path,
			});
		}
	}

	return [...available, ...FIXED_ITEMS];
}
