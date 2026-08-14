export interface IssueUser {
	id: string;
	username: string;
	avatar: string | null;
}

export interface IssueComment {
	id: number;
	body: string;
	createdBy: IssueUser;
	createdAt: string;
	updatedAt: string;
}

export interface Issue {
	id: number;
	number: number;
	title: string;
	description: string;
	state: "open" | "closed";
	author: IssueUser;
	assignees: IssueUser[];
	labels: string[];
	owner: string;
	repo: string;
	createdAt: string;
	updatedAt: string;
	closedAt: string | null;
	closedBy: IssueUser | null;
	closeReason: "completed" | "not_planned" | "duplicated" | null;
	dueDate: string | null;
	commentCount: number;
	comments?: IssueComment[];
}

export interface IssuesList {
	issues: Issue[];
	open: number;
	closed: number;
	total: number;
}

export type IssueSort =
	| "newest"
	| "oldest"
	| "recently-updated"
	| "least-updated"
	| "most-commented"
	| "least-commented"
	| "nearest-due"
	| "farthest-due";

export interface IssueFilters {
	state?: "open" | "closed";
	author?: string;
	assignee?: string;
	search?: string;
	sort?: IssueSort;
}
