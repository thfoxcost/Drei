export interface PRUser {
	id: string;
	username: string;
	avatar: string | null;
}

export interface PullRequestComment {
	id: number;
	body: string;
	createdBy: PRUser;
	createdAt: string;
	updatedAt: string;
}

export interface PullRequestEvent {
	id: number;
	type: "opened" | "comment" | "state_change" | "merged";
	actor: PRUser;
	metadata?: Record<string, unknown>;
	createdAt: string;
}

export interface PRLabel {
	id: number;
	name: string;
	color: string;
}

export interface PullRequest {
	id: number;
	number: number;
	title: string;
	description: string;
	state: "open" | "closed" | "merged";
	author: PRUser;
	sourceBranch: string;
	targetBranch: string;
	mergeCommitHash: string | null;
	mergedAt: string | null;
	mergedBy: PRUser | null;
	closedAt: string | null;
	closedBy: PRUser | null;
	createdAt: string;
	updatedAt: string;
	commentCount: number;
	comments?: PullRequestComment[];
	assignees?: PRUser[];
	reviewers?: PRUser[];
	labels?: PRLabel[];
	participants?: PRUser[];
}

export interface PullRequestsList {
	pulls: PullRequest[];
	open: number;
	closed: number;
	merged: number;
}

export type PRSort =
	| "newest"
	| "oldest"
	| "recently-updated"
	| "least-updated"
	| "most-commented"
	| "least-commented"
	| "source-branch"
	| "target-branch";

export interface PRFilters {
	state?: "open" | "closed" | "merged";
	author?: string;
	search?: string;
	sort?: PRSort;
}
