/** Home dashboard cards, activity feed and system health widget. */
export const dashboard = {
	contributions: {
		loadFailed: "Failed to load contributions",
		label_one: "{{count}} contribution",
		label_other: "{{count}} contributions",
	},

	profile: {
		loading: "Loading profile...",
		loadFailed: "Failed to load profile",
		edit: "Edit Profile",
	},

	activity: {
		loadFailed: "Failed to load activity",
		emptyTitle: "No activity yet",
		emptyDescription: "Actions on your repositories will show up here",
		createdRepository: "created repository",
		forked: "forked",
		from: "from",
		openedIssue: "opened issue",
		closedIssue: "closed issue",
		openedPull: "opened pull request",
		mergedPull: "merged pull request",
		closedPull: "closed pull request",
		approvedPull: "approved pull request",
		pushedCommit: "pushed a commit to",
	},

	health: {
		status: {
			operational: "Operational",
			checking: "Checking",
			offline: "Offline",
			unavailable: "Unavailable",
		},
		loading: "Loading...",
		loadFailed: "System health is currently unavailable.",
		frontend: "Frontend",
		backend: "Backend",
		database: "Database",
		storage: "Storage",
		metrics: {
			cpu: "CPU",
			client: "Client",
			process: "Process",
			storage: "Storage",
			uptime: "Uptime",
		},
		memoryDetail: "Resident set size · heap {{used}} of {{total}}",
		processDetail:
			"Resident set size · heap {{heap}} {{unit}} · {{goroutines}} goroutines",
		uptimeDetail: "Backend {{version}} · {{environment}} · host up {{uptime}}",
		signedInOnly: "System metrics are only available to signed-in users.",
	},

	weather: {
		loading: "Loading...",
		feelsLike: "Feels Like {{value}}°",
	},

	sports: {
		live: "Live",
		final: "UCL Final",
	},
} as const;
