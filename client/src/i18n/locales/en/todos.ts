/** To-do list statuses, reminder kinds and the reminder dialog vocabulary. */
export const todos = {
	status: {
		undone: "Undone",
		progress: "In progress",
		done: "Done",
		discarded: "Discarded",
	},

	markAsStatus: "Mark as {{status}}",
	markAs: "Mark as",
	statusLabel: "Status: {{status}}",
	pin: "Pin",
	unpin: "Unpin",
	edit: "Edit",

	reminder: {
		set: "Set reminder",
		clear: "Clear reminder",
		nextOpen: "Next time I open the app",
		onRepoPage: "When I open a repo page...",
		onRepoPageShort: "On a repo page",
		atTime: "At a time...",
		atTimeShort: "At a time",
		repoPageTitle: "Remind me on a repo page",
		created: "Created {{date}}",
		summaryAt: "At {{date}}",
		changeRepoPage: "Change repo page...",
		changeTime: "Change time...",
		remindMe: "Remind me",
		summaryOn: "On {{repo}}",
	},
} as const;
