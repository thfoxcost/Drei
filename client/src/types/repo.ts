import type { Contributor } from "@/components/repo/right-panel";
export interface Commit {
	hash: string;
	message: string;
	author: string;
	date: string;
}

export interface BlobData {
	name: string;
	path: string;
	size: number;
	hash: string;
	content: string;
	lastCommit: Commit;
}

export interface RepoFile {
	name: string;
	path: string;
	size: number;
	hash: string;
	type: boolean;
	content: string;
	lastCommit: Commit;
	isNested: boolean;
}

export interface Lang {
	name: string;
	bytes: number;
	percent: number;
}

export interface TagInfo {
	name: string;
	target: string;
	commit: string;
	shortSha: string;
	type: "annotated" | "lightweight";
	message?: string;
	taggerName?: string;
	taggerEmail?: string;
	taggerDate?: string;
	commitMessage?: string;
}

export interface RepoData {
	name: string;
	owner: string;
	ownerId: string;
	email: string;
	description: string;
	visibility: boolean;
	logo: string;
	website: string;
	archived: boolean;
	archivedAt: string;
	hasCommits: boolean;
	created: string;
	langs: Lang[];
	branches: string[];
	branchDates: Record<string, string>;
	defaultBranch: string;
	tags: TagInfo[] | null;
	cloneUrl: string;
	commits: Commit[];
	commitActivity: { date: string; count: number }[];
	lastCommit: Commit;
	files: RepoFile[];
	size: number;
	contributors: Contributor[];
	issueCount: number;
	isFork: boolean;
	forkedFromOwner: string;
	forkedFromName: string;
}
