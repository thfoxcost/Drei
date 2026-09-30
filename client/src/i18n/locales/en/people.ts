/** People directory tables, the global repository list and the create-repo form. */
export const people = {
	heading: "People",
	repositoriesHeading: "Repositories",

	peopleTable: {
		loading: "Loading people...",
		loadFailed: "Failed to load people.",
		empty: "No people found.",
		noMatch: "No people match the current search and filters.",
		searchPlaceholder: "Search by name or email...",
		filterStatus: "Filter by status",
		filterCountry: "Filter by country",
		filterOrganization: "Filter by organization",
		columns: {
			username: "Username",
			profession: "Profession",
			email: "Email",
			organizations: "Organizations",
			topRepository: "Top repository",
			country: "Country",
			status: "Status",
			joined: "Joined",
		},
		status: {
			status: "Status",
			online: "Online",
			offline: "Offline",
			all: "All",
		},
		lastActive: "Last active {{time}}",
		neverActive: "Never active",
		filterOrganizationLabel: "Organization",
		filterCountryLabel: "Country",
	},

	reposTable: {
		loading: "Loading repositories...",
		loadFailed: "Failed to load repositories.",
		empty: "No repositories found.",
		noMatch: "No repositories match the current search and filters.",
		searchPlaceholder: "Search by name, owner, or description...",
		filterType: "Filter by type",
		filterLanguage: "Filter by language",
		columns: {
			repository: "Repository",
			owner: "Owner",
			description: "Description",
			language: "Language",
			openIssues: "Open issues",
			updated: "Updated",
		},
		joined: "Joined {{date}}",
		filterTypeLabel: "Type",
		filterLanguageLabel: "Language",
	},

	preview: {
		noDetails: "No details for {{username}}",
		joinedTitle: "Joined",
	},
} as const;

/** The global "new repository" form and the shared repository list filter bar. */
export const repositories = {
	heading: "Repositories",
	searchPlaceholder: "Search repositories...",
	empty: "No repositories found",
	noRepositoriesYet: "No repositories yet",
	nothingMatches: 'Nothing matches "{{query}}"',
	loadFailed: "Failed to load repositories",
	new: "New",

	visibility: {
		public: "Public",
		private: "Private",
	},

	types: {
		all: "All",
		source: "Source",
		forked: "Forked",
		mirrored: "Mirrored",
		archived: "Archived",
	},

	sort: {
		label: "Sort",
		lastUpdated: "Last updated",
		name: "Name",
	},

	filters: {
		type: "Type",
		language: "Languages",
		updated: "Updated {{time}}",
		forkedFrom: "Forked from",
	},
};

/** Create-repository form. */
export const createRepo = {
	heading: "Create a new repository",
	subtitle:
		"A repository contains all of your project's files and revision history.",
	owner: "Owner *",
	unknownUser: "Unknown User",
	name: "Repository name *",
	namePlaceholder: "awesome-project",
	nameLeadingSpace: "Name cannot start with a space",
	nameHelp: "Great repository names are short and memorable. Need inspiration?",
	generateName: "Generate a random name",
	generateNameEnd: ".",
	description: "Description",
	descriptionPlaceholder: "Tell people what your repository is about...",
	descriptionHelp:
		"Briefly describe your repository (optional, max 350 characters).",
	configuration: "Configuration",
	chooseVisibility: "Choose visibility",
	chooseVisibilityHelp: "Choose who can see and commit to this repository",
	orgRepositoriesPublic: "Organization repositories are public for now.",
	visibilityPublic: "Public",
	visibilityPublicHelp:
		"Anyone on the internet can see this repository. You choose who can commit.",
	visibilityPrivate: "Private",
	visibilityPrivateHelp:
		"You choose who can see and commit to this repository.",
	creating: "Creating...",
	create: "Create repository",
	fillAllFields: "Please fill all the fields",
	nameLeadingSpaceError: "Repository name cannot start with a space",
	ownerUnknown: "Repository created, but the owner is unknown",
	createFailed: "Failed to create repository",
} as const;
