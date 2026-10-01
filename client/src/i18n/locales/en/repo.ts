/** Repository pages: header, tabs, code browser, commits, readme, clone, settings. */
export const repo = {
	tabs: {
		code: "Code",
		issues: "Issues",
		pulls: "Pull Requests",
		actions: "Actions",
		security: "Security",
		insights: "Insights",
		settings: "Settings",
	},

	docs: {
		readme: "README",
		license: "License",
		changelog: "Changelog",
		contributing: "Contributing",
		security: "Security",
		codeOfConduct: "Code of Conduct",
		support: "Support",
		authors: "Authors",
	},

	sidebar: {
		readme: "Readme",
		license: "License",
		codeOfConduct: "Code of Conduct",
		contributing: "Contributing",
		security: "Security",
		size: "Size",
		about: "About",
		noDescription: "No description",
		forkedFrom: "Forked from",
		createdAt: "Created at :",
		activity: "Activity",
		contribution: "Contribution",
		contributors: "Contributors",
		languages: "Languages",
		customizeSidebar: "Customize sidebar sections",
		sidebarSections: "Sidebar sections",
		sidebarSectionsDescription:
			"Choose what shows up in the sidebar. Saved to this browser only.",
	},

	visibility: {
		public: "Public",
		private: "Private",
		mirrored: "Mirrored",
		archived: "Archived",
		archivedAndPublic: "archived and public",
		archivedAndPrivate: "archived and private",
		archivedOn: "This repo was archived on {{date}}. It is now read-only.",
		archivedOnUnknown:
			"This repo was archived on an unknown date. It is now read-only.",
	},

	header: {
		newRepository: "New repository",
		newIssue: "New issue",
		share: "Share Repository",
		copyRepoUrl: "Copy Repository URL",
		openInBrowser: "Open in Browser",
		generateQr: "Generate QR Code",
		scanMe: "Scan me",
		backup: "Backup",
		backupOff: "Backup off",
		backupLatest: "Latest",
		backupOutdated: "Outdated",
		createBackup: "Create backup",
		backupsDisabled: "Backups are disabled",
	},

	clone: {
		label: "Clone",
		copied: "Copied to clipboard",
		comingSoon: "Coming soon",
		copyUrl: "Copy clone URL",
		sshComingSoon: "SSH coming soon",
		cliComingSoon: "CLI coming soon",
		openWithVSCode: "Open with VS Code",
		openWithDrei: "Open with Drei Desktop",
		downloadZip: "Download ZIP",
		downloadTarGz: "Download TAR.GZ",
		downloadReadme: "Download README",
		vscodeMissing:
			"VS Code doesn't appear to be installed, or the vscode:// link could not be opened",
	},

	fork: {
		label: "Fork",
		dropdown: "Toggle dropdown",
		forkedTimes_one: "Forked {{count}} time",
		forkedTimes_other: "Forked {{count}} times",
		noForks: "No forks yet",
		firstForkHint: "Be the first to fork this repository.",
		failed: "Failed to fork repository",
		success: "Repository forked successfully",
		error: "Something went wrong while forking",
		createHeading: "Create a new fork",
		createIntro:
			"A fork is a copy of a repository. Forking a repository allows you to freely experiment with changes without affecting the original project.",
		ownerLabel: "Owner*",
		orgSelectorSoon: "Organization selector coming soon.",
		nameLabel: "Repository name*",
		namePlaceholder: "awesome-project",
		nameHelp:
			"By default, forks are named the same as their upstream repository. You can customize the name to distinguish it further.",
		descriptionLabel: "Description",
		descriptionPlaceholder: "Tell people what your repository is about...",
		descriptionHelp:
			"Briefly describe your repository (optional, max 350 characters).",
		copyMainLabel: "Copy the main branch only",
		copyMainHelp: "Only copy the main branch instead of all branches.",
		personalNote: "You are creating a fork in your personal account.",
		creating: "Creating...",
		create: "Create fork",
	},

	stars: {
		dropdown: "Toggle dropdown",
		label: "Star",
		saveComingSoon: "Save repo coming soon",
	},

	readme: {
		nothingToSee: "Nothing to see here",
		emptyFile: "This file is empty.",
	},

	code: {
		files: "Files",
		goToFile: "Go to file",
		searchFiles: "Search files...",
		searchWithinCode: "Search within code",
		noMatches: "No matches",
		matchCount_one: "{{count}} match",
		matchCount_other: "{{count}} matches",
		collapsedCode: "Collapse code",
		expandedCode: "Expand code",
		copyFilePath: "Copy file path",
		viewed: "Viewed",
		copy: "Copy",

		fileStats: "{{lines}} lines ({{loc}} loc)",
		browseFiles: "Browse Files",

		previewTab: "Preview",
		codeTab: "Code",
		blameTab: "Blame",
		editFile: "Edit file",
		deleteFile: "Delete file",
		viewRawFile: "View raw file",
		copyFile: "Copy file",
		copyToClipboard: "Copy to clipboard",
		copiedExclaim: "Copied!",
		downloadFile: "Download file",
		downloadDiff: "Download diff",

		expandAllMenu: "Expand all",
		collapseAllMenu: "Collapse all",

		addFile: "Add file",
		openComingSoon: "Open coming soon",

		failedToLoad: "Failed to load file",
		browseSidebarTitle: "Please browse the files from the sidebar",
		browseSidebarDescription:
			"Select a file from the sidebar to view its contents.",

		latestCommits: {
			committed: "{{author}} committed {{time}}",
		},
	},

	refSwitcher: {
		label: "Switch branch or tag",
		placeholder: "Find a branch or tag...",
		branches: "Branches",
		noBranches: "No branches found",
		tags: "Tags",
		noTags: "No tags found",
		default: "Default",
		deleteBranch: "Delete branch {{branch}}",
		deleteTitle: 'Delete "{{branch}}"?',
		deleteBody:
			"This action cannot be undone. This will permanently delete the {{branch}} branch and it cannot be recovered.",
		deleteBranchFailed: "Failed to delete branch",
		branchDeleted: 'Branch "{{branch}}" deleted',
	},

	table: {
		commits: "Commits",
		noCommitMessage: "No commit message",
		viewDiff: "View diff",
		viewCommit: "View commit",
		copyCommitHash: "Copy commit hash",
		branchLabel: "Branch",
		deletedBranch: "Delete branch",
		selected: "selected",
		commitsCount_one: "{{count}} commit",
		commitsCount_other: "{{count}} commits",
	},

	tags: {
		title: "Tags",
		count_one: "{{count}} tag",
		count_other: "{{count}} tags",
		noMessage: "No commit message",
		empty: "No tags",
		emptyDescription: "Tags pushed to this repository will show up here.",
		loadFailed: "Failed to load tags",
		loadFailedDescription: "Something went wrong while fetching tags.",
	},

	download: {
		failed: "Failed to download archive",
		noReadme: "No README found in this repository",
	},

	charts: {
		activity: "Activity",
		commits: "Commits",
		prs: "PRs",
		issues: "Issues",
		noActivity: "No activity",
		commitsTotal_one: "{{count}} commit",
		commitsTotal_other: "{{count}} commits",
	},

	empty: {
		actions: {
			title: "Actions",
			description:
				"Actions haven't been implemented yet. They'll be available in a future update.",
		},
		security: {
			title: "Security",
			description:
				"Security features haven't been implemented yet. They'll be available in a future update.",
		},
		none: {
			title: "No Repository yet",
			description:
				"You haven't created any repositories yet. Create your first repository to start hosting your projects.",
		},
		guided: {
			title: "Push your first commit",
			description:
				"Empty repository — push your first commit with the commands below.",
		},
		loadFailed: "Failed to load repository",
		loadFailedBody: "Something went wrong while fetching this repository.",
		retrying: "Retrying...",
		tryAgain: "Try again",
	},

	settings: {
		general: {
			title: "Settings",
			nameLabel: "Repository name",
			descriptionLabel: "Description",
			visibility: "Visibility",
			websiteLabel: "Website",
			logo: "Logo",
			logoHint: "PNG, JPG, WebP or GIF, up to 2 MB.",
			logoAlt: "{{name}} logo",
			logoUpdated: "Logo updated",
			logoUploadFailed: "Failed to upload logo",
			defaultBranch: "Default branch",
			defaultBranchDescription:
				"The default branch is considered the “base” branch in your repository, against which all pull requests and code commits are automatically made, unless you specify a different branch.",
			noBranches: "No branches",
			rename: "Rename",
			updating: "Updating...",
			update: "Update repository info",
			infoUpdated: "Repository info updated",
			infoUpdateFailed: "Failed to update repository info",
		},
		nav: {
			general: "General",
			branches: "Branches",
			tags: "Tags",
			backup: "Backup",
			actions: "Actions",
			settings: "Settings",
			collaborators: "Collaborators",
			code: "Code",
			access: "Access",
			codeManagement: "Code Management",
			backupDesc:
				"Create and manage backups of your repository to protect your code and Git history.",
			branchesDesc:
				"Manage your repository branches and configure branch-related settings.",
			tagsDesc:
				"Manage repository tags and organize your releases and versions.",
			actionsDesc:
				"Configure automated workflows and actions for your repository.",
		},
		backup: {
			title: "Backup",
			description:
				"Automatically back up this repository to protect your code and Git history. Only the newest snapshot is kept.",
			alertTitle: "Repository backup",
			alertEnabled: "Backups enabled",
			loading: "Loading backup status...",
			lastBackup: "Last backup {{date}} ({{hash}}, {{size}}) — ",
			upToDate: "up to date.",
			newCommits: "new commits available.",
			noBackup:
				"No backup created yet. Run the first backup to protect this repository.",
			enableHint: "Enable backups to protect your code and Git history.",
			backingUp: "Backing up...",
			backupNow: "Back up now",
			disable: "Disable",
			enable: "Enable",
			enabledToast: "Backups enabled",
			disabledToast: "Backups disabled",
			createdToast: "Backup created",
		},
		collab: {
			title: "Collaborators and teams",
			collaborators: "Collaborators",
			loading: "Loading collaborators...",
			empty:
				"No collaborators yet. Contribute to this repository or add users below to see them here.",
			admin: "Admin",
			collaborator: "Collaborator",
			remove: "Remove {{username}}",
			addHeading: "Add a collaborator",
			loadingUsers: "Loading users...",
			noUsers:
				"No users available to add. Every registered user is already a collaborator.",
			searchPlaceholder: "Search users to add...",
			noUsersFound: "No users found.",
			addedToast: "{{username}} added as collaborator",
			removedToast: "{{username}} removed from collaborators",
			fetchFailed: "Failed to fetch collaborators",
			addFailed: "Failed to add collaborator",
			removeFailed: "Failed to remove collaborator",
		},
		webhooks: {
			title: "Repository Webhooks",
			description:
				"Send repository events to a Discord channel. This is separate from your personal notification webhooks.",
			urlLabel: "Discord webhook URL",
			urlPlaceholder: "https://discord.com/api/webhooks/...",
			configuredAs: "Configured as {{masked}}",
			notConfigured: "No Discord webhook configured yet.",
			prLabel: "Pull request notifications",
			prHelp:
				"Notify when pull requests are opened, commented on, approved, or have changes requested.",
			issueLabel: "Issue notifications",
			issueHelp: "Notify when issues are opened or receive new comments.",
			loading: "Loading webhook configuration...",
			loadFailed: "Failed to load webhook configuration",
			forbidden: "Only the repository owner or admins can manage webhooks.",
			save: "Save",
			saving: "Saving...",
			saved: "Discord webhook saved",
			saveFailed: "Failed to save Discord webhook",
			delete: "Remove",
			deleting: "Removing...",
			deleted: "Discord webhook removed",
			deleteFailed: "Failed to remove Discord webhook",
		},
		danger: {
			title: "Danger Zone",
			changeVisibility: "Change repository visibility",
			currentVisibility: "This repository is currently {{status}}.",
			makePublic: "Make public",
			makePrivate: "Make private",
			archive: "Archive this repository",
			archiveDescription: "Mark this repository as archived and read-only.",
			unarchive: "Unarchive this repository",
			archivedToast: "Repository archived",
			unarchivedToast: "Repository unarchived",
			updateFailed: "Failed to update repository",
			delete: "Delete this repository",
			deleteWarning:
				"Once you delete a repository, there is no going back. Please be certain.",
			deletedToast: "Repository deleted",
			deleteFailed: "Failed to delete repository",
			deleteTitle: "Delete {{name}}?",
			deleteBody:
				"This action cannot be undone. This will permanently delete the {{name}} repository and all of its contents. Please type the repository name to confirm.",
			deleteConfirmHint: "To confirm, type {{name}} in the box below",
			deleteConfirm: "I understand, delete this repository",
			visibilityUpdated: "Repository is now {{visibility}}",
			updateVisibilityFailed: "Failed to update visibility",
		},
	},

	commit: {
		title: "Commit",
		loading: "Loading...",
		parents_one: "{{count}} parent",
		parents_other: "{{count}} parents",
		commit: "commit",
		changedFiles_one: "{{count}} changed file",
		changedFiles_other: "{{count}} changed files",
		with: "with",
		additions: "additions",
		and: "and",
		deletions: "deletions",
	},

	/** The repository commits page: author filter, date filter, empty state. */
	commits: {
		noMatch: "No commits found matching the current filters.",
		dateLabel: "Date",
		clearDateFilter: "Clear date filter",
		anyUser: "Any user",
		searchUsers: "Search users",
	},
} as const;
