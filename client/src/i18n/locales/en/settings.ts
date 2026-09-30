/** Settings shell tabs plus the profile / general / notifications / appearance pages. */
export const settings = {
	headerSubtitle: "Your personal account",

	tabs: {
		profile: "Public Profile",
		account: "Account",
		general: "General",
		actions: "Actions",
		notifications: "Notifications",
		appearance: "Appearance",
	},

	actions: {
		heading: "Actions",
		description:
			"Configure automated workflows and actions for your repository.",
	},

	profile: {
		title: "Profile",
		loading: "Loading profile...",
		updateInfo: "Update Info",
		updating: "Updating...",
		updated: "Profile updated",
		updateFailed: "Failed to update profile",
		loadFailed: "Failed to load profile data",
		loadFailedShort: "Failed to load profile",
		avatarUpdated: "Avatar updated",
		avatarUpdateFailed: "Failed to update avatar",

		username: "Username",
		usernamePlaceholder: "Enter your username",
		usernameHelp: "Your name may appear around the app.",
		email: "Email",
		emailPlaceholder: "name@example.com",
		emailHelp: "We'll send updates to this address.",
		profession: "Profession",
		professionPlaceholder: "e.g. Frontend Engineer",
		professionHelp: "What you do — shown in the People directory.",
		biography: "Biography",
		biographyPlaceholder: "Tell us a little about yourself...",
		biographyHelp: "Tell people a little about yourself.",
		description: "Description",
		descriptionPlaceholder: "Tell us more about yourself.",
		country: "Country",
		countryPlaceholder: "Select your country",
		countryEmpty: "No country found.",

		quoteHeading: "Quote",
		quoteLabel: "Quote",
		quotePlaceholder:
			"Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
		quoteHelp: "The quote that you want to display on your profile.",
		personName: "Person Name",
		personNamePlaceholder: "Richard Feynman",
		personNameHelp: "The person who said the quote.",
		personTitle: "Person Title",
		personTitlePlaceholder: "Physicist & Mathematician",
		personTitleHelp: "What the person does or is known for.",
		personImage: "Person Image",
		personImagePlaceholder: "https://example.com/person.jpg",
		personImageHelp: "Enter a direct link to the person's image.",
		verified: "Verified",
		verifiedHelp: "Show a verified badge next to the person's name.",
		avatarUpdatedShort: "Avatar updated",
	},

	general: {
		title: "General",
		loading: "Loading settings...",
		todoLabel: "To-do list",
		todoDescriptionBefore:
			"Show the built-in to-do list in the header. Disabling it also turns off the",
		todoDescriptionAfter: "shortcut and every reminder.",
		todoEnabled: "To-do list enabled",
		todoDisabled: "To-do list disabled",
		saveFailed: "Failed to save setting",
	},

	notifications: {
		title: "Notifications",
		loading: "Loading notifications...",
		subtitle: "Configure notifications to receive repository events.",
		new: "New notification",
		discord: "Discord",
		discordTitle: "Discord",
		discordDescription: "Send repository activity notifications to Discord.",
		discordUrlLabel: "Discord Notification URL",
		discordUrlHelp: "Paste your Discord notification webhook URL.",
		discordUrlPlaceholder: "discord.com/api/webhooks/...",
		testTitle: "Drei notification test",
		testBody: "This is a test notification from Drei.",
		test: "Test",
		testing: "Testing...",
		testSent: "Test notification sent",
		testFailed: "Test failed",
		testFailedShort: "Test notification failed",
		sendFailed: "Failed to send notification",
		created: "Notification created",
		createFailed: "Failed to create notification",
		removed: "Notification removed",
		removeFailed: "Failed to delete notification",
		loadFailed: "Failed to load notifications",
		enterUrl: "Enter a URL first",
		emptyTitle: "No notifications configured",
		emptyBody: "Add a Discord notification to start receiving events.",
		warningTitle: "Notifications are not currently used",
		warningBody:
			"This notification integration is configured but is not currently connected to any application events.",
	},

	appearance: {
		title: "Appearance",
		loading: "Loading appearance...",

		themeLabel: "Theme",
		themeDescription: "Choose the appearance of the application.",
		themeLight: "Light",
		themeDark: "Dark",
		themeSystem: "System",

		languageLabel: "Language",
		languageDescription: "Choose the language used by the application.",

		heatmapLabel: "Contribution heatmap",
		heatmapDescription:
			"Choose which calendar year your contribution heatmap displays. Applies instantly.",
		heatmapColorLabel: "Profile color heatmap",
		heatmapColorDescription:
			"Tint your contribution heatmap with the dominant color of your profile picture.",

		loadFailed: "Failed to load appearance settings",
		saveFailed: "Failed to save appearance",
		saved: "Appearance settings saved",
	},
} as const;
