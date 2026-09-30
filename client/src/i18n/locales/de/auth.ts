/** Sign-in / sign-up screens and the shared auth form vocabulary. */
export const auth = {
	divider: "ODER",
	email: {
		label: "E-Mail",
		placeholder: "beispiel@email.de",
		invalid: "Ungültige E-Mail-Adresse",
	},
	password: {
		label: "Passwort",
		placeholder: "Passwort",
		tooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
	},
	name: {
		label: "Name",
		placeholder: "Max Mustermann",
		tooShort: "Der Name muss mindestens 2 Zeichen lang sein.",
		leadingSpace: "Der Name darf nicht mit einem Leerzeichen beginnen",
	},
	logoAlt: "Logo",

	signIn: {
		submit: "Mit E-Mail fortfahren",
		withGitHub: "GitHub",
		noAccount: "Noch kein Konto?",
		signUpLink: "Registrieren",
		welcome: "Willkommen zurück!",
	},

	signUp: {
		submit: "Konto erstellen",
		withGitHub: "Mit GitHub registrieren",
		hasAccount: "Schon ein Konto?",
		signInLink: "Anmelden",
		created: "Konto erstellt!",
	},

	account: {
		title: "Kontoeinstellungen",
		loading: "Konto wird geladen...",
		emailHeading: "E-Mail",
		emailLabel: "E-Mail-Adresse",
		emailPlaceholder: "name@example.com",
		emailDescription: "Diese E-Mail-Adresse wird für dein Konto verwendet.",
		emailUpdated: "E-Mail-Adresse aktualisiert",
		emailRequired: "E-Mail-Adresse darf nicht leer sein",
		emailUpdateFailed: "E-Mail-Adresse konnte nicht aktualisiert werden",
		updateEmail: "E-Mail-Adresse aktualisieren",
		updating: "Wird aktualisiert...",

		passwordHeading: "Passwort",
		passwordLabel: "Passwort",
		currentPassword: "Aktuelles Passwort",
		currentPasswordPlaceholder: "Gib dein aktuelles Passwort ein",
		newPassword: "Neues Passwort",
		newPasswordPlaceholder: "Gib dein neues Passwort ein",
		confirmNewPassword: "Neues Passwort bestätigen",
		confirmNewPasswordPlaceholder: "Bestätige dein neues Passwort",
		changePassword: "Passwort ändern",
		changing: "Wird geändert...",
		passwordChanged: "Passwort geändert",
		passwordChangeFailed: "Passwort konnte nicht geändert werden",
		enterCurrentPassword: "Bitte gib dein aktuelles Passwort ein",
		enterNewPassword: "Bitte gib ein neues Passwort ein",
		newPasswordTooShort:
			"Das neue Passwort muss mindestens 8 Zeichen lang sein",
		passwordsDoNotMatch: "Die neuen Passwörter stimmen nicht überein",
		enterPassword: "Bitte gib dein Passwort ein",
		confirmPasswordLabel: "Passwort bestätigen",
		confirmPasswordPlaceholder: "Gib dein Passwort ein",
		confirmPasswordHelp:
			"Gib dein Passwort ein, um zu bestätigen, dass dein Konto dauerhaft gelöscht wird.",

		dangerHeading: "Gefahrenzone",
		deleteLabel: "Konto löschen",
		deleteHelp:
			"Löscht dein Konto und alle zugehörigen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.",
		deleteButton: "Konto löschen",
		deleteDialogTitle: "Konto löschen?",
		deleteDialogDescription:
			"Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden dein Konto und alle zugehörigen Daten dauerhaft gelöscht.",
		deleteConfirm: "Konto endgültig löschen",
		deleting: "Wird gelöscht...",
		deleted: "Konto erfolgreich gelöscht",
		deleteFailed: "Konto konnte nicht gelöscht werden",
		loadFailed: "Kontodaten konnten nicht geladen werden",
	},
} as const;
