/** Branch/file compare view and the repository insights pages. */
export const compare = {
	selectBranchesTitle:
		"Wähle oben zwei Branches aus, um Änderungen zu vergleichen und einen Pull Request zu erstellen.",
	selectBranchesButton: "Branches auswählen, um fortzufahren",
	invalidTitle: "Ungültiger Vergleich",
	invalidDescription: "Bitte gib einen gültigen Basis- und Quell-Branch an.",
	genericError:
		"Etwas ist schiefgelaufen. Bitte versuche es erneut oder wähle einen anderen Vergleich.",
	sameBranchTitle: "Gleicher Branch ausgewählt",
	sameBranchDescription:
		"Basis- und Vergleichs-Branch müssen unterschiedlich sein. Bitte wähle einen anderen Vergleichs-Branch.",
	loading: "Vergleich wird geladen...",
	loadFailed: "Vergleich konnte nicht geladen werden",
	loadFailedBody: "Diese Branches konnten nicht verglichen werden.",

	baseBranchPlaceholder: "Basis-Branch wählen",
	compareBranchPlaceholder: "Vergleichs-Branch wählen",
	helper:
		"Änderungen aus dem Vergleichs-Branch werden in den Basis-Branch gemergt. Der Basis-Branch ist das Ziel, der Vergleichs-Branch enthält die Änderungen, die du prüfen und mergen möchtest.",
	comparing: "Branches werden verglichen...",
	cannotMergeCleanly: "Diese Branches lassen sich nicht sauber mergen.",
	compareFailed: "Branches konnten nicht verglichen werden: {{message}}",
	unknownError: "Unbekannter Fehler",

	headingCreate: "Pull Request öffnen",
	headingReview: "Änderungen vergleichen",
	subtitleCreate:
		"Prüfe die Änderungen zwischen diesen beiden Branches und öffne einen Pull Request.",
	subtitleReview:
		"Wähle zwei Branches aus, um zu sehen, was sich geändert hat, oder um einen neuen Pull Request zu starten.",

	commits: "Commits",
	commitsCount_one: "{{count}} Commit",
	commitsCount_other: "{{count}} Commits",
	loadingCommits: "Commits werden geladen...",
	noCommits: "Keine Commits gefunden.",

	stats: {
		commits: "Commits",
		filesChanged: "geänderte Dateien",
		contributors: "Mitwirkende",
	},
	additions: "Hinzufügungen",
	deletions: "Löschungen",
	/**
	 * Zusammenfassung der geänderten Dateien, mit <Trans> gerendert, damit jede
	 * hervorgehobene Zahl ihre eigene <strong>-Hülle und ihre grüne bzw. rote
	 * Farbgebung behält.
	 *
	 * Die benannten Tags sind die Formatierungs-Haken: `files` wird neutral
	 * hervorgehoben, `additions` grün, `deletions` rot. Sämtliche Wörter und die
	 * Wortfolge stehen hier, damit eine Übersetzung den Satz umstellen kann, ohne
	 * JSX anzufassen. Die Zahlen kommen als Interpolationswerte.
	 */
	summaryTrans:
		"Angezeigt <files>{{count}} {{filesChanged}}</files> mit <additions>+{{additionsCount}} {{additionsLabel}}</additions> und <deletions>-{{deletionsCount}} {{deletionsLabel}}</deletions>.",
} as const;

/** Repository insights: pulse overview, contributors, code frequency, recent commits. */
export const insights = {
	tabs: {
		pulse: "Überblick",
		contributors: "Mitwirkende",
		codeFrequency: "Code-Frequenz",
		recentCommits: "Letzte Commits",
	},

	pulse: {
		heading: "Letzte 7 Tage",
		overview: "Überblick",
		pullRequests: "Pull Requests",
		mergedPrs: "Gemergte Pull Requests",
		closedPrs: "Geschlossene Pull Requests",
		issues: "Issues",
		closedIssues: "Geschlossene Issues",
		newIssues: "Neue Issues",
		merged: "gemergt",
		closed: "geschlossen",
		new: "neu",
		noCommits: "Noch keine Commits.",

		narrative: {
			author_one: "{{count}} Autor:in",
			author_other: "{{count}} Autor:innen",
			commit_one: "{{count}} Commit",
			commit_other: "{{count}} Commits",
			secondCommit_one: "{{count}} Commit",
			secondCommit_other: "{{count}} Commits",
			files: "{{count}} Dateien",
			additions: "{{count}} Hinzufügungen",
			deletions: "{{count}} Löschungen",
			/**
			 * Puls-Zusammenfassung, mit <Trans> gerendert, damit jede
			 * hervorgehobene Zahl ihre eigene <strong>-Hülle behält und die
			 * Hinzufügungs-/Löschungszahlen ihre grüne bzw. rote Farbgebung.
			 *
			 * Die benannten Tags sind die Formatierungs-Haken, ihr Inhalt sind
			 * die oben beugierten Werte. Sämtliche Wörter und die Wortfolge stehen
			 * in diesem einen String, damit eine Übersetzung den Satz frei umstellen
			 * kann, ohne JSX anzufassen.
			 */
			summaryTrans:
				"Ohne Merges hat <authors>{{authors}}</authors> <commits>{{commits}}</commits> nach <branch>{{branch}}</branch> und <commits2>{{secondCommits}}</commits2> auf alle Branches gepusht. Bei {{branch}}, <files>{{files}}</files> gibt es Änderungen, und es wurden <additions>{{additions}}</additions> und <deletions>{{deletions}}</deletions>.",
		},
	},

	contributors: {
		heading: "Mitwirkende an {{owner}}/{{repo}}",
		subheading: "Commits pro Tag",
		loading: "Mitwirkende werden geladen…",
		loadFailed: "Mitwirkende konnten nicht geladen werden.",
		empty: "In diesem Repository gibt es noch keine Mitwirkenden.",
		commits: "Commits",
		commitCount_one: "{{count}} Commit",
		commitCount_other: "{{count}} Commits",
	},

	codeFrequency: {
		heading: "Code-Frequenz im Verlauf von {{owner}}/{{repo}}",
		subheading: "Code-Frequenz",
		loading: "Code-Frequenz wird geladen…",
		loadFailed: "Code-Frequenz konnte nicht geladen werden.",
		empty: "In diesem Repository gibt es noch keine Commits.",
		additions: "Hinzufügungen",
		deletions: "Löschungen",
		weekOf: "Woche vom {{value}}",
	},

	recentCommits: {
		heading: "Letzte Commits in {{owner}}/{{repo}}",
		subheading: "Letzte Commits",
		window: "Zeigt Commits der letzten {{days}} Tage",
		totalCommits: "Commits insgesamt",
		loading: "Commit-Aktivität wird geladen…",
		loadFailed: "Commit-Aktivität konnte nicht geladen werden.",
		empty: "In diesem Repository gibt es noch keine Commits.",
		commits: "Commits",
	},
} as const;
