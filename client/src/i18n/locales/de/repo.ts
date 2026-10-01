/** Repository pages: header, tabs, code browser, commits, readme, clone, settings. */
export const repo = {
	tabs: {
		code: "Code",
		issues: "Issues",
		pulls: "Pull Requests",
		actions: "Aktionen",
		security: "Sicherheit",
		insights: "Insights",
		settings: "Einstellungen",
	},

	docs: {
		readme: "README",
		license: "Lizenz",
		changelog: "Änderungsprotokoll",
		contributing: "Mitwirken",
		security: "Sicherheit",
		codeOfConduct: "Verhaltenskodex",
		support: "Support",
		authors: "Autoren",
	},

	sidebar: {
		readme: "Readme",
		license: "Lizenz",
		codeOfConduct: "Verhaltenskodex",
		contributing: "Mitwirken",
		security: "Sicherheit",
		size: "Größe",
		about: "Über",
		noDescription: "Keine Beschreibung",
		forkedFrom: "Geforkt von",
		createdAt: "Erstellt am:",
		activity: "Aktivität",
		contribution: "Beiträge",
		contributors: "Mitwirkende",
		languages: "Sprachen",
		customizeSidebar: "Seitenleisten-Bereiche anpassen",
		sidebarSections: "Seitenleisten-Bereiche",
		sidebarSectionsDescription:
			"Wähle aus, was in der Seitenleiste erscheint. Wird nur in diesem Browser gespeichert.",
	},

	visibility: {
		public: "Öffentlich",
		private: "Privat",
		mirrored: "Gespiegelt",
		archived: "Archiviert",
		archivedAndPublic: "archiviert und öffentlich",
		archivedAndPrivate: "archiviert und privat",
		archivedOn:
			"Dieses Repository wurde am {{date}} archiviert. Es ist jetzt schreibgeschützt.",
		archivedOnUnknown:
			"Dieses Repository wurde an einem unbekannten Datum archiviert. Es ist jetzt schreibgeschützt.",
	},

	header: {
		newRepository: "Neues Repository",
		newIssue: "Neues Issue",
		share: "Repository teilen",
		copyRepoUrl: "Repository-URL kopieren",
		openInBrowser: "Im Browser öffnen",
		generateQr: "QR-Code erstellen",
		scanMe: "Scannen",
		backup: "Backup",
		backupOff: "Backup aus",
		backupLatest: "Aktuell",
		backupOutdated: "Veraltet",
		createBackup: "Backup erstellen",
		backupsDisabled: "Backups sind deaktiviert",
	},

	clone: {
		label: "Klonen",
		copied: "In die Zwischenablage kopiert",
		comingSoon: "Demnächst verfügbar",
		copyUrl: "Klon-URL kopieren",
		sshComingSoon: "SSH demnächst verfügbar",
		cliComingSoon: "CLI demnächst verfügbar",
		openWithVSCode: "Mit VS Code öffnen",
		openWithDrei: "Mit Drei Desktop öffnen",
		downloadZip: "ZIP herunterladen",
		downloadTarGz: "TAR.GZ herunterladen",
		downloadReadme: "README herunterladen",
		vscodeMissing:
			"VS Code scheint nicht installiert zu sein oder der vscode://-Link konnte nicht geöffnet werden",
	},

	fork: {
		label: "Forken",
		dropdown: "Dropdown umschalten",
		forkedTimes_one: "{{count}}-mal geforkt",
		forkedTimes_other: "{{count}}-mal geforkt",
		noForks: "Noch keine Forks",
		firstForkHint: "Forke dieses Repository als Erste:r.",
		failed: "Repository konnte nicht geforkt werden",
		success: "Repository erfolgreich geforkt",
		error: "Beim Forken ist etwas schiefgelaufen",
		createHeading: "Neuen Fork erstellen",
		createIntro:
			"Ein Fork ist eine Kopie eines Repositorys. Wenn du ein Repository forkst, kannst du frei damit experimentieren, ohne das Originalprojekt zu beeinflussen.",
		ownerLabel: "Besitzer:in*",
		orgSelectorSoon: "Organisationsauswahl folgt in Kürze.",
		nameLabel: "Repository-Name*",
		namePlaceholder: "tolles-projekt",
		nameHelp:
			"Standardmäßig trägt ein Fork denselben Namen wie das ursprüngliche Repository. Du kannst einen anderen Namen wählen, um ihn deutlicher zu unterscheiden.",
		descriptionLabel: "Beschreibung",
		descriptionPlaceholder: "Beschreibe, worum es in diesem Repository geht...",
		descriptionHelp:
			"Beschreibe dein Repository kurz (optional, maximal 350 Zeichen).",
		copyMainLabel: "Nur den Haupt-Branch kopieren",
		copyMainHelp: "Kopiere nur den Haupt-Branch statt aller Branches.",
		personalNote: "Du erstellst einen Fork in deinem persönlichen Konto.",
		creating: "Wird erstellt...",
		create: "Fork erstellen",
	},

	stars: {
		dropdown: "Dropdown umschalten",
		label: "Stern",
		saveComingSoon: "Repo speichern kommt bald",
	},

	readme: {
		nothingToSee: "Hier gibt es nichts zu sehen",
		emptyFile: "Diese Datei ist leer.",
	},

	code: {
		files: "Dateien",
		goToFile: "Zu Datei springen",
		searchFiles: "Dateien durchsuchen...",
		searchWithinCode: "Im Code suchen",
		noMatches: "Keine Treffer",
		matchCount_one: "{{count}} Treffer",
		matchCount_other: "{{count}} Treffer",
		collapsedCode: "Code einklappen",
		expandedCode: "Code ausklappen",
		copyFilePath: "Dateipfad kopieren",
		viewed: "Angesehen",
		copy: "Kopieren",

		fileStats: "{{lines}} Zeilen ({{loc}} loc)",
		browseFiles: "Dateien durchsuchen",

		previewTab: "Vorschau",
		codeTab: "Code",
		blameTab: "Blame",
		editFile: "Datei bearbeiten",
		deleteFile: "Datei löschen",
		viewRawFile: "Rohdatei ansehen",
		copyFile: "Datei kopieren",
		copyToClipboard: "In die Zwischenablage kopieren",
		copiedExclaim: "Kopiert!",
		downloadFile: "Datei herunterladen",
		downloadDiff: "Diff herunterladen",

		expandAllMenu: "Alle ausklappen",
		collapseAllMenu: "Alle einklappen",

		addFile: "Datei hinzufügen",
		openComingSoon: "Öffnen kommt bald",

		failedToLoad: "Datei konnte nicht geladen werden",
		browseSidebarTitle: "Bitte wähle eine Datei aus der Seitenleiste aus",
		browseSidebarDescription:
			"Wähle eine Datei aus der Seitenleiste aus, um ihren Inhalt zu sehen.",

		latestCommits: {
			committed: "{{author}} hat {{time}} committet",
		},
	},

	refSwitcher: {
		label: "Branch oder Tag wechseln",
		placeholder: "Branch oder Tag suchen...",
		branches: "Branches",
		noBranches: "Keine Branches gefunden",
		tags: "Tags",
		noTags: "Keine Tags gefunden",
		default: "Standard",
		deleteBranch: "Branch {{branch}} löschen",
		deleteTitle: "Branch „{{branch}}“ löschen?",
		deleteBody:
			"Diese Aktion kann nicht rückgängig gemacht werden. Der Branch {{branch}} wird endgültig gelöscht und kann nicht wiederhergestellt werden.",
		deleteBranchFailed: "Branch konnte nicht gelöscht werden",
		branchDeleted: "Branch „{{branch}}“ gelöscht",
	},

	table: {
		commits: "Commits",
		noCommitMessage: "Keine Commit-Nachricht",
		viewDiff: "Diff ansehen",
		viewCommit: "Commit ansehen",
		copyCommitHash: "Commit-Hash kopieren",
		branchLabel: "Branch",
		deletedBranch: "Branch löschen",
		selected: "ausgewählt",
		commitsCount_one: "{{count}} Commit",
		commitsCount_other: "{{count}} Commits",
	},

	tags: {
		title: "Tags",
		count_one: "{{count}} Tag",
		count_other: "{{count}} Tags",
		noMessage: "Keine Commit-Nachricht",
		empty: "Keine Tags",
		emptyDescription:
			"Hier erscheinen alle Tags, die in dieses Repository gepusht wurden.",
		loadFailed: "Tags konnten nicht geladen werden",
		loadFailedDescription: "Beim Abrufen der Tags ist etwas schiefgelaufen.",
	},

	download: {
		failed: "Archiv konnte nicht heruntergeladen werden",
		noReadme: "In diesem Repository wurde keine README gefunden",
	},

	charts: {
		activity: "Aktivität",
		commits: "Commits",
		prs: "PRs",
		issues: "Issues",
		noActivity: "Keine Aktivität",
		commitsTotal_one: "{{count}} Commit",
		commitsTotal_other: "{{count}} Commits",
	},

	empty: {
		actions: {
			title: "Aktionen",
			description:
				"Aktionen wurden noch nicht umgesetzt. Sie werden in einem zukünftigen Update verfügbar sein.",
		},
		security: {
			title: "Sicherheit",
			description:
				"Sicherheitsfunktionen wurden noch nicht umgesetzt. Sie werden in einem zukünftigen Update verfügbar sein.",
		},
		none: {
			title: "Noch kein Repository",
			description:
				"Du hast noch keine Repositorys erstellt. Erstelle dein erstes Repository, um deine Projekte zu hosten.",
		},
		guided: {
			title: "Ersten Commit pushen",
			description:
				"Leeres Repository – pushe deinen ersten Commit mit den Befehlen unten.",
		},
		loadFailed: "Repository konnte nicht geladen werden",
		loadFailedBody: "Beim Laden dieses Repositorys ist etwas schiefgelaufen.",
		retrying: "Wird erneut versucht...",
		tryAgain: "Erneut versuchen",
	},

	settings: {
		general: {
			title: "Einstellungen",
			nameLabel: "Repository-Name",
			descriptionLabel: "Beschreibung",
			visibility: "Sichtbarkeit",
			websiteLabel: "Website",
			logo: "Logo",
			logoHint: "PNG, JPG, WebP oder GIF, bis zu 2 MB.",
			logoAlt: "Logo von {{name}}",
			logoUpdated: "Logo aktualisiert",
			logoUploadFailed: "Logo konnte nicht hochgeladen werden",
			defaultBranch: "Standard-Branch",
			defaultBranchDescription:
				"Der Standard-Branch gilt als „Basis-Branch“ deines Repositorys. Alle Pull Requests und Code-Commits werden automatisch dagegen erstellt, sofern du keinen anderen Branch angibst.",
			noBranches: "Keine Branches",
			rename: "Umbenennen",
			updating: "Wird aktualisiert...",
			update: "Repository-Info aktualisieren",
			infoUpdated: "Repository-Info aktualisiert",
			infoUpdateFailed: "Repository-Info konnte nicht aktualisiert werden",
		},
		nav: {
			general: "Allgemein",
			branches: "Branches",
			tags: "Tags",
			backup: "Backup",
			actions: "Aktionen",
			settings: "Einstellungen",
			collaborators: "Mitwirkende",
			code: "Code",
			access: "Zugriff",
			codeManagement: "Code-Verwaltung",
			backupDesc:
				"Erstelle und verwalte Backups deines Repositorys, um deinen Code und deine Git-Historie zu schützen.",
			branchesDesc:
				"Verwalte die Branches deines Repositorys und konfiguriere branchbezogene Einstellungen.",
			tagsDesc:
				"Verwalte die Tags deines Repositorys und organisiere Releases und Versionen.",
			actionsDesc:
				"Konfiguriere automatisierte Workflows und Aktionen für dein Repository.",
		},
		backup: {
			title: "Backup",
			description:
				"Erstelle automatisch Backups dieses Repositorys, um deinen Code und deine Git-Historie zu schützen. Es wird nur der neueste Snapshot aufbewahrt.",
			alertTitle: "Repository-Backup",
			alertEnabled: "Backups aktiviert",
			loading: "Backup-Status wird geladen...",
			lastBackup: "Letztes Backup {{date}} ({{hash}}, {{size}}) — ",
			upToDate: "aktuell.",
			newCommits: "neue Commits verfügbar.",
			noBackup:
				"Noch kein Backup erstellt. Führe das erste Backup aus, um dieses Repository zu schützen.",
			enableHint:
				"Aktiviere Backups, um deinen Code und deine Git-Historie zu schützen.",
			backingUp: "Backup wird erstellt...",
			backupNow: "Jetzt sichern",
			disable: "Deaktivieren",
			enable: "Aktivieren",
			enabledToast: "Backups aktiviert",
			disabledToast: "Backups deaktiviert",
			createdToast: "Backup erstellt",
		},
		collab: {
			title: "Mitwirkende und Teams",
			collaborators: "Mitwirkende",
			loading: "Mitwirkende werden geladen...",
			empty:
				"Noch keine Mitwirkenden. Bring dich in diesem Repository ein oder füge unten Nutzer:innen hinzu, um sie hier zu sehen.",
			admin: "Admin",
			collaborator: "Mitwirkende:r",
			remove: "{{username}} entfernen",
			addHeading: "Mitwirkende hinzufügen",
			loadingUsers: "Nutzer:innen werden geladen...",
			noUsers:
				"Keine Nutzer:innen zum Hinzufügen verfügbar. Alle registrierten Nutzer:innen sind bereits Mitwirkende.",
			searchPlaceholder: "Nutzer:innen zum Hinzufügen suchen...",
			noUsersFound: "Keine Nutzer:innen gefunden.",
			addedToast: "{{username}} als Mitwirkende:r hinzugefügt",
			removedToast: "{{username}} von den Mitwirkenden entfernt",
			fetchFailed: "Mitwirkende konnten nicht geladen werden",
			addFailed: "Mitwirkende:r konnte nicht hinzugefügt werden",
			removeFailed: "Mitwirkende:r konnte nicht entfernt werden",
		},
		webhooks: {
			title: "Repository-Webhooks",
			description:
				"Repository-Ereignisse an einen Discord-Kanal senden. Unabhängig von deinen persönlichen Benachrichtigungs-Webhooks.",
			urlLabel: "Discord-Webhook-URL",
			urlPlaceholder: "https://discord.com/api/webhooks/...",
			configuredAs: "Konfiguriert als {{masked}}",
			notConfigured: "Noch kein Discord-Webhook konfiguriert.",
			prLabel: "Pull-Request-Benachrichtigungen",
			prHelp:
				"Benachrichtigen, wenn Pull Requests geöffnet, kommentiert, freigegeben oder mit Änderungswünschen versehen werden.",
			issueLabel: "Issue-Benachrichtigungen",
			issueHelp:
				"Benachrichtigen, wenn Issues geöffnet werden oder neue Kommentare erhalten.",
			loading: "Webhook-Konfiguration wird geladen...",
			loadFailed: "Webhook-Konfiguration konnte nicht geladen werden",
			forbidden:
				"Nur der Repository-Eigentümer oder Admins können Webhooks verwalten.",
			save: "Speichern",
			saving: "Wird gespeichert...",
			saved: "Discord-Webhook gespeichert",
			saveFailed: "Discord-Webhook konnte nicht gespeichert werden",
			delete: "Entfernen",
			deleting: "Wird entfernt...",
			deleted: "Discord-Webhook entfernt",
			deleteFailed: "Discord-Webhook konnte nicht entfernt werden",
		},
		danger: {
			title: "Gefahrenzone",
			changeVisibility: "Sichtbarkeit des Repositorys ändern",
			currentVisibility: "Dieses Repository ist derzeit {{status}}.",
			makePublic: "Öffentlich machen",
			makePrivate: "Privat machen",
			archive: "Dieses Repository archivieren",
			archiveDescription:
				"Dieses Repository als archiviert und schreibgeschützt markieren.",
			unarchive: "Archivierung aufheben",
			archivedToast: "Repository archiviert",
			unarchivedToast: "Archivierung aufgehoben",
			updateFailed: "Repository konnte nicht aktualisiert werden",
			delete: "Dieses Repository löschen",
			deleteWarning:
				"Wenn du ein Repository löschst, gibt es kein Zurück. Bitte sei dir sicher.",
			deletedToast: "Repository gelöscht",
			deleteFailed: "Repository konnte nicht gelöscht werden",
			deleteTitle: "{{name}} löschen?",
			deleteBody:
				"Diese Aktion kann nicht rückgängig gemacht werden. Dabei wird das Repository {{name}} samt seiner Inhalte endgültig gelöscht. Bitte gib zur Bestätigung den Repository-Namen ein.",
			deleteConfirmHint: "Gib zur Bestätigung {{name}} in das Feld unten ein",
			deleteConfirm: "Verstanden, dieses Repository löschen",
			visibilityUpdated: "Repository ist jetzt {{visibility}}",
			updateVisibilityFailed: "Sichtbarkeit konnte nicht aktualisiert werden",
		},
	},

	commit: {
		title: "Commit",
		loading: "Wird geladen...",
		parents_one: "{{count}} Eltern-Commit",
		parents_other: "{{count}} Eltern-Commits",
		commit: "Commit",
		changedFiles_one: "{{count}} geänderte Datei",
		changedFiles_other: "{{count}} geänderte Dateien",
		with: "mit",
		additions: "Hinzufügungen",
		and: "und",
		deletions: "Löschungen",
	},

	/** Die Commit-Seite des Repositorys: Autor:innen-Filter, Datumsfilter, Leerzustand. */
	commits: {
		noMatch: "Keine Commits gefunden, die den aktuellen Filtern entsprechen.",
		dateLabel: "Datum",
		clearDateFilter: "Datumsfilter zurücksetzen",
		anyUser: "Alle Nutzer:innen",
		searchUsers: "Nutzer:innen suchen",
	},
} as const;
