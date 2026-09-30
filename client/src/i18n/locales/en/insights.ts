/** Branch/file compare view and the repository insights pages. */
export const compare = {
	selectBranchesTitle:
		"Select two branches above to compare changes and create a pull request.",
	selectBranchesButton: "Select branches to continue",
	invalidTitle: "Invalid comparison",
	invalidDescription: "Please provide a valid base and source branch.",
	genericError:
		"Something went wrong. Please try again or use a different comparison.",
	sameBranchTitle: "Same branch selected",
	sameBranchDescription:
		"Base and compare branches must be different. Please select a different compare branch.",
	loading: "Loading comparison...",
	loadFailed: "Failed to load comparison",
	loadFailedBody: "Could not compare these branches.",

	baseBranchPlaceholder: "Choose base branch",
	compareBranchPlaceholder: "Choose compare branch",
	helper:
		"Changes from the compare branch will be merged into the base branch. The base branch is the target, while the compare branch contains the changes you want to review and merge.",
	comparing: "Comparing branches...",
	cannotMergeCleanly: "These branches cannot be merged cleanly.",
	compareFailed: "Failed to compare branches: {{message}}",
	unknownError: "Unknown error",

	headingCreate: "Open a pull request",
	headingReview: "Compare changes",
	subtitleCreate:
		"Review the changes between these two branches and open a pull request.",
	subtitleReview:
		"Choose two branches to see what's changed or to start a new pull request.",

	commits: "Commits",
	commitsCount_one: "{{count}} commit",
	commitsCount_other: "{{count}} commits",
	loadingCommits: "Loading commits...",
	noCommits: "No commits found.",

	stats: {
		commits: "commits",
		filesChanged: "files changed",
		contributors: "contributors",
	},
	additions: "additions",
	deletions: "deletions",
	/**
	 * Changed-files summary, rendered with <Trans> so each highlighted number
	 * keeps its own <strong> wrapper and its green/red styling.
	 *
	 * The named tags are the styling hooks: `files` is emphasised neutrally,
	 * `additions` green, `deletions` red. Every literal word and the word order
	 * live here, so a translator can reshape the sentence without touching JSX.
	 * The counts arrive as interpolation values.
	 */
	summaryTrans:
		"Showing <files>{{count}} {{filesChanged}}</files> with <additions>+{{additionsCount}} {{additionsLabel}}</additions> and <deletions>-{{deletionsCount}} {{deletionsLabel}}</deletions>.",
} as const;

/** Repository insights: pulse overview, contributors, code frequency, recent commits. */
export const insights = {
	tabs: {
		pulse: "Pulse",
		contributors: "Contributors",
		codeFrequency: "Code Frequency",
		recentCommits: "Recent Commits",
	},

	pulse: {
		heading: "Last 7 days",
		overview: "Overview",
		pullRequests: "Pull Requests",
		mergedPrs: "Merged Pull Requests",
		closedPrs: "Closed Pull Requests",
		issues: "Issues",
		closedIssues: "Closed Issues",
		newIssues: "New Issues",
		merged: "merged",
		closed: "closed",
		new: "new",
		noCommits: "No commits yet.",

		narrative: {
			author_one: "{{count}} author",
			author_other: "{{count}} authors",
			commit_one: "{{count}} commit",
			commit_other: "{{count}} commits",
			secondCommit_one: "{{count}} commit",
			secondCommit_other: "{{count}} commits",
			files: "{{count}} files",
			additions: "{{count}} additions",
			deletions: "{{count}} deletions",
			/**
			 * Pulse narrative rendered with <Trans>, so every emphasised number
			 * keeps its own <strong> wrapper and the addition/deletion counts
			 * keep their green/red styling.
			 *
			 * The named tags are the styling hooks and their contents are the
			 * pluralised values above. Every literal word and the word order
			 * live in this one string, so a translator can reshape the sentence
			 * freely without touching JSX.
			 */
			summaryTrans:
				"Excluding merges, <authors>{{authors}}</authors> has pushed <commits>{{commits}}</commits> to <branch>{{branch}}</branch> and <commits2>{{secondCommits}}</commits2> to all branches. On {{branch}}, <files>{{files}}</files> have changed and there have been <additions>{{additions}}</additions> and <deletions>{{deletions}}</deletions>.",
		},
	},

	contributors: {
		heading: "Contributors to {{owner}}/{{repo}}",
		subheading: "Commits per day",
		loading: "Loading contributors…",
		loadFailed: "Failed to load contributors.",
		empty: "No contributors yet in this repository.",
		commits: "Commits",
		commitCount_one: "{{count}} commit",
		commitCount_other: "{{count}} commits",
	},

	codeFrequency: {
		heading: "Code frequency over the history of {{owner}}/{{repo}}",
		subheading: "Code Frequency",
		loading: "Loading code frequency…",
		loadFailed: "Failed to load code frequency.",
		empty: "No commits yet in this repository.",
		additions: "Additions",
		deletions: "Deletions",
		weekOf: "Week of {{value}}",
	},

	recentCommits: {
		heading: "Recent commits for {{owner}}/{{repo}}",
		subheading: "Recent Commits",
		window: "Showing commits over the last {{days}} days",
		totalCommits: "Total commits",
		loading: "Loading commit activity…",
		loadFailed: "Failed to load commit activity.",
		empty: "No commits yet in this repository.",
		commits: "Commits",
	},
} as const;
