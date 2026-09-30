/** Application chrome: header navigation, user menu, command palette, 404. */
export const nav = {
	items: {
		repositories: "Repositorys",
		issues: "Issues",
		pulls: "Pulls",
		organizations: "Organisationen",
		people: "Personen",
		search: "Suchen",
		home: "Startseite",
		openMenu: "Menü öffnen",
		logo: "Logo",
	},

	create: {
		label: "Erstellen",
		newRepository: "Neues Repository",
		newIssue: "Neues Issue",
	},

	user: {
		profile: "Profil",
		repositories: "Repositorys",
		organizations: "Organisationen",
		addOrganization: "Neue Organisation hinzufügen",
		settings: "Einstellungen",
		signOut: "Abmelden",
		noBiography: "Noch keine Biografie",
		avatarAlt: "Avatar von {{name}}",
	},

	help: {
		label: "Hilfe",
		docs: "Dokumentation",
		swagger: "Swagger",
		github: "GitHub",
	},

	command: {
		trigger: "Suchen...",
		shortcut: "⌘K",
		placeholder: "Suchen...",
		groupRepositories: "Repositorys",
		groupOrganizations: "Organisationen",
	},

	todos: {
		title: "To-do",
		placeholder: "To-do hinzufügen — @ erwähnen, # Repository",
		empty: "Noch nichts vorhanden",
		noMatches: "Keine passenden To-dos",
		noRepos: "Keine Repositorys gefunden",
		sectionPinned: "Angeheftet",
		sectionRest: "To-do",
		actionsFor: "Aktionen für {{title}}",
		edit: "To-do bearbeiten",
		pin: "Anheften",
		unpin: "Lösen",
		duplicate: "Duplizieren",
		clearReminder: "Erinnerung entfernen",
		reminderSet: "Erinnerung gesetzt",
		reminderToastDescription: "To-do-Erinnerung",
		remindMeLater: "Später erinnern",
		viewTitle: "To-do",
		undone: "Offen ({{count}})",
		done: "Erledigt ({{count}})",
	},

	notFound: {
		title: "404",
		description:
			"Die gesuchte Seite wurde möglicherweise verschoben oder existiert nicht.",
		goHome: "Zur Startseite",
		watchYouTube: "auf YouTube ansehen",
	},
} as const;
