export type ConversationComment = {
	type: "comment";
	commentId: number;
	date: string;
	username: string;
	avatarLink?: string;
	comment: string;
	isAuthor?: boolean;
	onEdit?: (commentId: number, body: string) => void;
	onDelete?: (commentId: number) => void;
	onQuoteReply?: (text: string) => void;
	issueBasePath?: { username: string; repo: string };
};

export type ConversationCommit = {
	type: "commit";
	date: string;
	username: string;
	avatarLink?: string;
	message: string;
	hash: string;
};

export type ConversationReview = {
	type: "review";
	date: string;
	username: string;
	avatarLink?: string;
	filePath: string;
	isOutdated?: boolean;
};

export type ConversationOpened = {
	type: "opened";
	date: string;
	username: string;
	avatarLink?: string;
	sourceBranch: string;
	targetBranch: string;
};

export type ConversationStateChange = {
	type: "state_change";
	date: string;
	username: string;
	avatarLink?: string;
	oldState: string;
	newState: string;
};

export type ConversationMerged = {
	type: "merged";
	date: string;
	username: string;
	avatarLink?: string;
};

export type ConversationItem =
	| ConversationComment
	| ConversationCommit
	| ConversationReview
	| ConversationOpened
	| ConversationStateChange
	| ConversationMerged;
