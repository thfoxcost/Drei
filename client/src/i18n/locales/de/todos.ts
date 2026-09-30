/** To-do list statuses, reminder kinds and the reminder dialog vocabulary. */
export const todos = {
	status: {
		undone: "Offen",
		progress: "In Arbeit",
		done: "Erledigt",
		discarded: "Verworfen",
	},

	markAsStatus: "Als {{status}} markieren",
	markAs: "Markieren als",
	statusLabel: "Status: {{status}}",
	pin: "Anheften",
	unpin: "Lösen",
	edit: "Bearbeiten",

	reminder: {
		set: "Erinnerung setzen",
		clear: "Erinnerung entfernen",
		nextOpen: "Beim nächsten Öffnen der App",
		onRepoPage: "Wenn ich eine Repository-Seite öffne...",
		onRepoPageShort: "Auf einer Repository-Seite",
		atTime: "Zu einer bestimmten Zeit...",
		atTimeShort: "Zu einer bestimmten Zeit",
		repoPageTitle: "Auf einer Repository-Seite erinnern",
		created: "Erstellt {{date}}",
		summaryAt: "Am {{date}}",
		changeRepoPage: "Repository-Seite ändern...",
		changeTime: "Zeit ändern...",
		remindMe: "Mich erinnern",
		summaryOn: "Auf {{repo}}",
	},
} as const;
