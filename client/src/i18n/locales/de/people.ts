/** People directory tables, the global repository list and the create-repo form. */
export const people = {
	heading: "Personen",
	repositoriesHeading: "Repositorys",

	peopleTable: {
		loading: "Personen werden geladen...",
		loadFailed: "Personen konnten nicht geladen werden.",
		empty: "Keine Personen gefunden.",
		noMatch: "Keine Person passt zur aktuellen Suche und den Filtern.",
		searchPlaceholder: "Nach Name oder E-Mail suchen...",
		filterStatus: "Nach Status filtern",
		filterCountry: "Nach Land filtern",
		filterOrganization: "Nach Organisation filtern",
		columns: {
			username: "Benutzername",
			profession: "Beruf",
			email: "E-Mail",
			organizations: "Organisationen",
			topRepository: "Top-Repository",
			country: "Land",
			status: "Status",
			joined: "Dabei seit",
		},
		status: {
			status: "Status",
			online: "Online",
			offline: "Offline",
			all: "Alle",
		},
		lastActive: "Zuletzt aktiv {{time}}",
		neverActive: "Noch nie aktiv",
		filterOrganizationLabel: "Organisation",
		filterCountryLabel: "Land",
	},

	reposTable: {
		loading: "Repositorys werden geladen...",
		loadFailed: "Repositorys konnten nicht geladen werden.",
		empty: "Keine Repositorys gefunden.",
		noMatch: "Kein Repository passt zur aktuellen Suche und den Filtern.",
		searchPlaceholder: "Nach Name, Besitzer:in oder Beschreibung suchen...",
		filterType: "Nach Typ filtern",
		filterLanguage: "Nach Sprache filtern",
		columns: {
			repository: "Repository",
			owner: "Besitzer:in",
			description: "Beschreibung",
			language: "Sprache",
			openIssues: "Offene Issues",
			updated: "Aktualisiert",
		},
		joined: "Dabei seit {{date}}",
		filterTypeLabel: "Typ",
		filterLanguageLabel: "Sprache",
	},

	preview: {
		noDetails: "Keine Details zu {{username}}",
		joinedTitle: "Dabei seit",
	},
} as const;

/** The global "new repository" form and the shared repository list filter bar. */
export const repositories = {
	heading: "Repositorys",
	searchPlaceholder: "Repositorys durchsuchen...",
	empty: "Keine Repositorys gefunden",
	noRepositoriesYet: "Noch keine Repositorys",
	nothingMatches: "Nichts passt zu „{{query}}“",
	loadFailed: "Repositorys konnten nicht geladen werden",
	new: "Neu",

	visibility: {
		public: "Öffentlich",
		private: "Privat",
	},

	types: {
		all: "Alle",
		source: "Original",
		forked: "Geforkt",
		mirrored: "Gespiegelt",
		archived: "Archiviert",
	},

	sort: {
		label: "Sortieren",
		lastUpdated: "Zuletzt aktualisiert",
		name: "Name",
	},

	filters: {
		type: "Typ",
		language: "Sprachen",
		updated: "Aktualisiert {{time}}",
		forkedFrom: "Geforkt von",
	},
};

/** Create-repository form. */
export const createRepo = {
	heading: "Neues Repository erstellen",
	subtitle:
		"Ein Repository enthält alle Dateien deines Projekts sowie deren Versionshistorie.",
	owner: "Besitzer:in *",
	unknownUser: "Unbekannte:r Benutzer:in",
	name: "Repository-Name *",
	namePlaceholder: "tolles-projekt",
	nameLeadingSpace: "Der Name darf nicht mit einem Leerzeichen beginnen",
	nameHelp:
		"Gute Repository-Namen sind kurz und einprägsam. Du brauchst Inspiration?",
	generateName: "Zufälligen Namen generieren",
	generateNameEnd: ".",
	description: "Beschreibung",
	descriptionPlaceholder: "Beschreibe, worum es in diesem Repository geht...",
	descriptionHelp:
		"Beschreibe dein Repository kurz (optional, maximal 350 Zeichen).",
	configuration: "Konfiguration",
	chooseVisibility: "Sichtbarkeit wählen",
	chooseVisibilityHelp:
		"Wähle, wer dieses Repository sehen und Beiträge dazu leisten kann",
	orgRepositoriesPublic: "Organisations-Repositorys sind derzeit öffentlich.",
	visibilityPublic: "Öffentlich",
	visibilityPublicHelp:
		"Jede:r im Internet kann dieses Repository sehen. Du legst fest, wer committen darf.",
	visibilityPrivate: "Privat",
	visibilityPrivateHelp:
		"Du legst fest, wer dieses Repository sehen und Beiträge dazu leisten kann.",
	creating: "Wird erstellt...",
	create: "Repository erstellen",
	fillAllFields: "Bitte fülle alle Felder aus",
	nameLeadingSpaceError:
		"Der Repository-Name darf nicht mit einem Leerzeichen beginnen",
	ownerUnknown: "Repository erstellt, aber die Besitzer:in ist unbekannt",
	createFailed: "Repository konnte nicht erstellt werden",
} as const;
