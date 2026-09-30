/** Application chrome: header navigation, user menu, command palette, 404. */
export const nav = {
	items: {
		repositories: "Repositories",
		issues: "Issues",
		pulls: "Pulls",
		organizations: "Organizations",
		people: "People",
		search: "Search",
		home: "Home",
		openMenu: "Open menu",
		logo: "Logo",
	},

	create: {
		label: "Create",
		newRepository: "New repository",
		newIssue: "New issue",
	},

	user: {
		profile: "Profile",
		repositories: "Repositories",
		organizations: "Organizations",
		addOrganization: "Add new organization",
		settings: "Settings",
		signOut: "Sign out",
		noBiography: "No biography yet",
		avatarAlt: "{{name}} avatar",
	},

	help: {
		label: "Help",
		docs: "Docs",
		swagger: "Swagger",
		github: "GitHub",
	},

	command: {
		trigger: "Search...",
		shortcut: "⌘K",
		placeholder: "Search...",
		groupRepositories: "Repositories",
		groupOrganizations: "Organizations",
	},

	todos: {
		title: "To-do",
		placeholder: "Add a to-do — @ mention, # repo",
		empty: "Nothing here yet",
		noMatches: "No matching to-dos",
		noRepos: "No repos found",
		sectionPinned: "Pinned",
		sectionRest: "To-do",
		actionsFor: "Actions for {{title}}",
		edit: "Edit to-do",
		pin: "Pin",
		unpin: "Unpin",
		duplicate: "Duplicate",
		clearReminder: "Clear reminder",
		reminderSet: "Reminder set",
		reminderToastDescription: "To-do reminder",
		remindMeLater: "Remind me later",
		viewTitle: "To-do",
		undone: "Undone ({{count}})",
		done: "Done ({{count}})",
	},

	notFound: {
		title: "404",
		description:
			"The page you're looking for might have been moved or doesn't exist.",
		goHome: "Go Home",
		watchYouTube: "watch YouTube",
	},
} as const;
