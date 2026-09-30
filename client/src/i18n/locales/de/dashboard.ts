/** Home dashboard cards, activity feed and system health widget. */
export const dashboard = {
	contributions: {
		loadFailed: "Beiträge konnten nicht geladen werden",
		label_one: "{{count}} Beitrag",
		label_other: "{{count}} Beiträge",
	},

	profile: {
		loading: "Profil wird geladen...",
		loadFailed: "Profil konnte nicht geladen werden",
		edit: "Profil bearbeiten",
	},

	activity: {
		loadFailed: "Aktivität konnte nicht geladen werden",
		emptyTitle: "Noch keine Aktivität",
		emptyDescription: "Aktionen in deinen Repositorys werden hier angezeigt",
		createdRepository: "hat das Repository erstellt",
		forked: "hat geforkt",
		from: "von",
		openedIssue: "hat ein Issue eröffnet",
		closedIssue: "hat ein Issue geschlossen",
		openedPull: "hat einen Pull Request eröffnet",
		mergedPull: "hat einen Pull Request gemergt",
		closedPull: "hat einen Pull Request geschlossen",
		approvedPull: "hat einen Pull Request genehmigt",
		pushedCommit: "hat einen Commit gepusht nach",
	},

	health: {
		status: {
			operational: "Betriebsbereit",
			checking: "Wird geprüft",
			offline: "Offline",
			unavailable: "Nicht verfügbar",
		},
		loading: "Wird geladen...",
		loadFailed: "Der Systemzustand ist derzeit nicht verfügbar.",
		frontend: "Frontend",
		backend: "Backend",
		database: "Datenbank",
		storage: "Speicher",
		metrics: {
			cpu: "CPU",
			client: "Client",
			process: "Prozess",
			storage: "Speicher",
			uptime: "Laufzeit",
		},
		memoryDetail: "Residenter Speicher · Heap {{used}} von {{total}}",
		processDetail:
			"Residenter Speicher · Heap {{heap}} {{unit}} · {{goroutines}} Goroutines",
		uptimeDetail:
			"Backend {{version}} · {{environment}} · Host läuft seit {{uptime}}",
		signedInOnly:
			"Systemmetriken sind nur für angemeldete Nutzer:innen verfügbar.",
	},

	weather: {
		loading: "Wird geladen...",
		feelsLike: "Gefühlt {{value}}°",
	},

	sports: {
		live: "Live",
		final: "CL-Finale",
	},
} as const;
