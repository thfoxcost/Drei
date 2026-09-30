/** Settings shell tabs plus the profile / general / notifications / appearance pages. */
export const settings = {
	headerSubtitle: "Dein persönliches Konto",

	tabs: {
		profile: "Öffentliches Profil",
		account: "Konto",
		general: "Allgemein",
		actions: "Aktionen",
		notifications: "Benachrichtigungen",
		appearance: "Darstellung",
	},

	actions: {
		heading: "Aktionen",
		description:
			"Automatisiierte Workflows und Aktionen für dein Repository konfigurieren.",
	},

	profile: {
		title: "Profil",
		loading: "Profil wird geladen...",
		updateInfo: "Informationen aktualisieren",
		updating: "Wird aktualisiert...",
		updated: "Profil aktualisiert",
		updateFailed: "Profil konnte nicht aktualisiert werden",
		loadFailed: "Profildaten konnten nicht geladen werden",
		loadFailedShort: "Profil konnte nicht geladen werden",
		avatarUpdated: "Avatar aktualisiert",
		avatarUpdateFailed: "Avatar konnte nicht aktualisiert werden",

		username: "Benutzername",
		usernamePlaceholder: "Gib deinen Benutzernamen ein",
		usernameHelp: "Dein Name kann in der App angezeigt werden.",
		email: "E-Mail",
		emailPlaceholder: "name@example.com",
		emailHelp: "An diese Adresse senden wir Updates.",
		profession: "Beruf",
		professionPlaceholder: "z. B. Frontend-Entwickler:in",
		professionHelp: "Was du machst — wird im Personenverzeichnis angezeigt.",
		biography: "Biografie",
		biographyPlaceholder: "Erzähl uns ein wenig über dich...",
		biographyHelp: "Erzähl anderen ein wenig über dich.",
		description: "Beschreibung",
		descriptionPlaceholder: "Erzähl uns mehr über dich.",
		country: "Land",
		countryPlaceholder: "Wähle dein Land",
		countryEmpty: "Kein Land gefunden.",

		quoteHeading: "Zitat",
		quoteLabel: "Zitat",
		quotePlaceholder:
			"Studiere mit großer Hingabe das, was dich am meisten interessiert – und zwar so undiszipliniert, respektlos und originell wie möglich.",
		quoteHelp: "Das Zitat, das auf deinem Profil angezeigt werden soll.",
		personName: "Name der Person",
		personNamePlaceholder: "Richard Feynman",
		personNameHelp: "Die Person, die das Zitat gesagt hat.",
		personTitle: "Titel der Person",
		personTitlePlaceholder: "Physiker & Mathematiker",
		personTitleHelp: "Wofür die Person bekannt ist oder was sie macht.",
		personImage: "Bild der Person",
		personImagePlaceholder: "https://example.com/person.jpg",
		personImageHelp: "Gib einen direkten Link zum Bild der Person ein.",
		verified: "Verifiziert",
		verifiedHelp: "Zeige neben dem Namen der Person ein Verifiziert-Badge an.",
		avatarUpdatedShort: "Avatar aktualisiert",
	},

	general: {
		title: "Allgemein",
		loading: "Einstellungen werden geladen...",
		todoLabel: "To-do-Liste",
		todoDescriptionBefore:
			"Zeige die integrierte To-do-Liste in der Kopfzeile an. Wenn du sie deaktivierst, werden auch die",
		todoDescriptionAfter:
			"Tastenkombination und alle Erinnerungen abgeschaltet.",
		todoEnabled: "To-do-Liste aktiviert",
		todoDisabled: "To-do-Liste deaktiviert",
		saveFailed: "Einstellung konnte nicht gespeichert werden",
	},

	notifications: {
		title: "Benachrichtigungen",
		loading: "Benachrichtigungen werden geladen...",
		subtitle:
			"Benachrichtigungen konfigurieren, um Ereignisse aus Repositorys zu empfangen.",
		new: "Neue Benachrichtigung",
		discord: "Discord",
		discordTitle: "Discord",
		discordDescription: "Aktivitäten in Repositorys an Discord senden.",
		discordUrlLabel: "Discord-Benachrichtigungs-URL",
		discordUrlHelp: "Füge deine Discord-Webhook-URL ein.",
		discordUrlPlaceholder: "discord.com/api/webhooks/...",
		testTitle: "Drei-Benachrichtigungstest",
		testBody: "Dies ist eine Testbenachrichtigung von Drei.",
		test: "Testen",
		testing: "Wird getestet...",
		testSent: "Testbenachrichtigung gesendet",
		testFailed: "Test fehlgeschlagen",
		testFailedShort: "Testbenachrichtigung fehlgeschlagen",
		sendFailed: "Benachrichtigung konnte nicht gesendet werden",
		created: "Benachrichtigung erstellt",
		createFailed: "Benachrichtigung konnte nicht erstellt werden",
		removed: "Benachrichtigung entfernt",
		removeFailed: "Benachrichtigung konnte nicht gelöscht werden",
		loadFailed: "Benachrichtigungen konnten nicht geladen werden",
		enterUrl: "Gib zuerst eine URL ein",
		emptyTitle: "Keine Benachrichtigungen konfiguriert",
		emptyBody:
			"Füge eine Discord-Benachrichtigung hinzu, um Ereignisse zu empfangen.",
		warningTitle: "Benachrichtigungen werden derzeit nicht verwendet",
		warningBody:
			"Diese Benachrichtigungsintegration ist konfiguriert, aber derzeit mit keinem Anwendungsereignis verbunden.",
	},

	appearance: {
		title: "Darstellung",
		loading: "Darstellung wird geladen...",

		themeLabel: "Design",
		themeDescription: "Wähle das Erscheinungsbild der Anwendung.",
		themeLight: "Hell",
		themeDark: "Dunkel",
		themeSystem: "System",

		languageLabel: "Sprache",
		languageDescription: "Wähle die Sprache, die die Anwendung verwendet.",

		heatmapLabel: "Beitrags-Heatmap",
		heatmapDescription:
			"Wähle das Kalenderjahr, das deine Beitrags-Heatmap anzeigt. Wird sofort übernommen.",
		heatmapColorLabel: "Heatmap in Profilfarbe",
		heatmapColorDescription:
			"Färbe deine Beitrags-Heatmap mit der dominanten Farbe deines Profilbilds ein.",

		loadFailed: "Darstellungseinstellungen konnten nicht geladen werden",
		saveFailed: "Darstellungseinstellungen konnten nicht gespeichert werden",
		saved: "Darstellungseinstellungen gespeichert",
	},
} as const;
