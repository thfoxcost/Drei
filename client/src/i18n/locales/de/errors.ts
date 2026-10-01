/**
 * Error copy.
 *
 * `code` maps 1:1 onto the `code` field emitted by the Go backend
 * (`writeErrorCoded` in `backend/internal/handlers/settings.go`). The client
 * never re-implements backend logic: it looks a code up here and falls back to
 * the English `error` field when a code is unknown (e.g. an uncoded technical
 * error), which `apiErrorMessage()` handles.
 *
 * `auth` maps better-auth's `APIError.body.code` values, which are stable
 * UPPER_SNAKE_CASE identifiers.
 */
export const errors = {
	/** Generic fallbacks used when no more specific message applies. */
	generic: {
		unknown: "Etwas ist schiefgelaufen",
		network: "Der Server war nicht erreichbar",
		notFound: "Nicht gefunden",
		forbidden: "Dafür fehlt dir die Berechtigung",
	},

	/** Generic client-side "failed to X" templates. */
	fetchFailed: "{{resource}} konnte nicht geladen werden",
	loadFailed: "{{resource}} konnte nicht geladen werden",
	saveFailed: "{{resource}} konnte nicht gespeichert werden",
	deleteFailed: "{{resource}} konnte nicht gelöscht werden",

	/**
	 * Client-side failures that never reach the backend: network errors and
	 * validation that happens before a request is made.
	 */
	client: {
		requestFailed: "Anfrage fehlgeschlagen",
		fetchToDos: "To-dos konnten nicht geladen werden",
		fetchRepository: "Repository konnte nicht geladen werden",
		fetchOrganizations: "Organisationen konnten nicht geladen werden",
		fetchOrganization: "Organisation konnte nicht geladen werden",
		fetchOrganizationMembers:
			"Organisationsmitglieder konnten nicht geladen werden",
		fetchOrganizationRepos:
			"Repositorys der Organisation konnten nicht geladen werden",
		fetchOrganizationLanguages:
			"Sprachen der Organisation konnten nicht geladen werden",
		fetchPullRequests: "Pull Requests konnten nicht geladen werden",
		fetchPullRequest: "Pull Request konnte nicht geladen werden",
		fetchPullRequestEvents:
			"Pull-Request-Ereignisse konnten nicht geladen werden",
		fetchPullRequestReviews:
			"Pull-Request-Reviews konnten nicht geladen werden",
		fetchCommits: "Commits konnten nicht geladen werden",
		fetchCommitDetails: "Commit-Details konnten nicht geladen werden",
		fetchChangedFiles: "Geänderte Dateien konnten nicht geladen werden",
		fetchViewedFiles: "Angesehene Dateien konnten nicht geladen werden",
		fetchIssues: "Issues konnten nicht geladen werden",
		fetchFile: "Datei konnte nicht geladen werden",
		fetchPeople: "Personen konnten nicht geladen werden",
		fetchUsers: "Nutzer:innen konnten nicht geladen werden",
		fetchRepos: "Repositorys konnten nicht geladen werden",
		fetchTags: "Tags konnten nicht geladen werden",
		fetchTag: "Tag konnte nicht geladen werden",
		fetchWeather: "Wetterdaten konnten nicht geladen werden",
		fetchActivity: "Aktivität konnte nicht geladen werden",
		fetchContributions: "Beiträge konnten nicht geladen werden",
		fetchInsights: "Insights konnten nicht geladen werden",
		fetchTodos: "To-dos konnten nicht geladen werden",
		fetchBackupStatus: "Backup-Status konnte nicht geladen werden",
		fetchAppearance: "Einstellungen konnten nicht geladen werden",
		saveAppearance: "Einstellungen konnten nicht gespeichert werden",
		fetchAppearanceMessage: "Darstellung konnte nicht geladen werden",
		saveAppearanceMessage: "Darstellung konnte nicht gespeichert werden",
		fetchProfile: "Profil konnte nicht geladen werden",
		fetchLabels: "Labels konnten nicht geladen werden",
		checkDuplicatePr: "Duplikate konnten nicht geprüft werden",
		checkMergeability: "Merge-Möglichkeit konnte nicht geprüft werden",
		checkSlug: "Slug konnte nicht geprüft werden",
		createPullRequest: "Pull Request konnte nicht erstellt werden",
		mergePullRequest: "Pull Request konnte nicht gemergt werden",
		revertPullRequest: "Pull Request konnte nicht zurückgenommen werden",
		deleteSourceBranch: "Quell-Branch konnte nicht gelöscht werden",
		updateViewedFile: "Angesehene Datei konnte nicht aktualisiert werden",
		compareBranches: "Branches konnten nicht verglichen werden",
		joinOrganization: "Der Organisation konnte nicht beigetreten werden",
		leaveOrganization: "Die Organisation konnte nicht verlassen werden",
		createOrganization: "Die Organisation konnte nicht erstellt werden",
		updateOrganization: "Die Organisation konnte nicht aktualisiert werden",
		deleteOrganization: "Die Organisation konnte nicht gelöscht werden",
		createRepository: "Repository konnte nicht erstellt werden",
		createNotification: "Benachrichtigung konnte nicht erstellt werden",
		testNotification: "Test fehlgeschlagen",
		testNotificationShort: "Testbenachrichtigung fehlgeschlagen",
		createBackup: "Backup konnte nicht erstellt werden",
		updateBackupSetting: "Backup-Einstellung konnte nicht aktualisiert werden",
		uploadFailed: "Hochladen fehlgeschlagen",
		avatarUnsupportedType:
			"Nicht unterstützter Dateityp. Bitte lade ein PNG-, JPG-, WebP- oder GIF-Bild hoch.",
		avatarTooLarge:
			"Das Bild ist zu groß. Bitte wähle ein Bild mit weniger als 8 MB.",
		avatarReadFailed: "Die Bilddatei konnte nicht gelesen werden.",
		avatarCanvasUnsupported:
			"Canvas wird von diesem Browser nicht unterstützt.",
		fileUploadUnsupportedType:
			"Nicht unterstützter Dateityp. Bitte verwende {{types}}.",
		fileUploadTooLarge:
			"Die Datei ist zu groß. Bitte wähle eine Datei mit weniger als {{size}} MB.",
		colorSampleFailed: "Bild für die Farbentnahme konnte nicht geladen werden",
		unknownLocation: "Unbekannter Ort",
		geolocationNotSupported: "Standortbestimmung wird nicht unterstützt",
		updateAssignees: "Zuweisungen konnten nicht aktualisiert werden",
		updateReviewers: "Reviewer:innen konnten nicht aktualisiert werden",
		updateLabels: "Labels konnten nicht aktualisiert werden",
		createLabel: "Label konnte nicht erstellt werden",
	},
	auth: {
		INVALID_EMAIL: "Ungültige E-Mail-Adresse",
		INVALID_EMAIL_OR_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch",
		INVALID_PASSWORD: "Passwort ist falsch",
		USER_NOT_FOUND: "Zu dieser E-Mail-Adresse wurde kein Konto gefunden",
		USER_ALREADY_EXISTS:
			"Mit dieser E-Mail-Adresse existiert bereits ein Konto",
		USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
			"Mit dieser E-Mail-Adresse existiert bereits ein Konto. Bitte verwende eine andere E-Mail-Adresse.",
		INVALID_USER: "Ungültige:r Benutzer:in",
		INVALID_TOKEN: "Ungültiger Token",
		TOKEN_EXPIRED: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
		SESSION_EXPIRED:
			"Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
		SESSION_NOT_FRESH:
			"Bitte melde dich erneut an, um diese Aktion zu bestätigen",
		FAILED_TO_CREATE_USER: "Das Konto konnte nicht erstellt werden",
		FAILED_TO_CREATE_SESSION: "Die Anmeldung ist fehlgeschlagen",
		FAILED_TO_GET_SESSION: "Deine Sitzung konnte nicht geladen werden",
		FAILED_TO_UPDATE_USER: "Dein Konto konnte nicht aktualisiert werden",
		FAILED_TO_GET_USER_INFO: "Dein Profil konnte nicht geladen werden",
		EMAIL_NOT_VERIFIED: "Diese E-Mail-Adresse ist nicht bestätigt",
		EMAIL_ALREADY_VERIFIED: "Diese E-Mail-Adresse ist bereits bestätigt",
		PASSWORD_TOO_SHORT: "Das Passwort ist zu kurz",
		PASSWORD_TOO_LONG: "Das Passwort ist zu lang",
		PASSWORD_ALREADY_SET:
			"Für dieses Konto ist bereits ein Passwort hinterlegt",
		USER_ALREADY_HAS_PASSWORD:
			"Für dieses Konto ist bereits ein Passwort hinterlegt. Gib es an, um das Konto zu löschen.",
		EMAIL_CAN_NOT_BE_UPDATED: "Die E-Mail-Adresse kann nicht geändert werden",
		CHANGE_EMAIL_DISABLED: "Das Ändern der E-Mail-Adresse ist deaktiviert",
		CREDENTIAL_ACCOUNT_NOT_FOUND:
			"Für dieses Konto ist kein Passwort hinterlegt",
		ACCOUNT_NOT_FOUND: "Konto nicht gefunden",
		FIELD_NOT_ALLOWED: "Dieses Feld kann nicht gesetzt werden",
		VALIDATION_ERROR: "Bitte prüfe das Formular und versuche es erneut",
		INVALID_ORIGIN: "Ungültige Herkunft",
		INVALID_CALLBACK_URL: "Ungültige Callback-URL",
		INVALID_REDIRECT_URL: "Ungültige Weiterleitungs-URL",
		SOCIAL_ACCOUNT_ALREADY_LINKED:
			"Dieses Social-Account ist bereits verknüpft",
		PROVIDER_NOT_FOUND: "Anbieter nicht gefunden",
		FAILED_TO_UNLINK_LAST_ACCOUNT:
			"Du kannst dein letztes Konto nicht von der Verknüpfung lösen",
		EMAIL_MISMATCH: "Die E-Mail-Adressen stimmen nicht überein",
		CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
			"Dieser Anmeldeversuch wurde aus Sicherheitsgründen blockiert",
		VERIFICATION_EMAIL_NOT_ENABLED: "Bestätigungs-E-Mails sind nicht aktiviert",
		MISSING_FIELD: "Dieses Feld ist erforderlich",
		UNKNOWN: "Etwas ist schiefgelaufen",
	},

	/** Backend error codes. Keep alphabetical; see the header note. */
	code: {
		already_organization_member: "Du bist bereits Mitglied dieser Organisation",
		auth_required_for_private_org:
			"Für private Organisationen ist eine Anmeldung erforderlich",
		auth_required_for_private_repos:
			"Für private Repositorys ist eine Anmeldung erforderlich",
		authentication_required: "Anmeldung erforderlich",
		backups_disabled: "Backups sind für dieses Repository deaktiviert",
		branch_name_required: "Ein Branch-Name ist erforderlich",
		branch_not_merged:
			"Der Quell-Branch kann erst nach dem Merge gelöscht werden",
		branches_must_differ: "Quell- und Ziel-Branch müssen unterschiedlich sein",
		cannot_add_repository_owner:
			"Die Besitzer:in des Repositorys kann nicht hinzugefügt werden",
		cannot_delete_issue:
			"Nur die Autor:in des Issues oder die Besitzer:in des Repositorys kann ein Issue löschen",
		cannot_fork_own_repository:
			"Du kannst dein eigenes Repository nicht forken",
		cannot_remove_repository_owner:
			"Die Besitzer:in des Repositorys kann nicht entfernt werden",
		cannot_review_own_pull:
			"Du kannst deinen eigenen Pull Request weder genehmigen noch Änderungen anfordern",
		comment_body_required: "Ein Kommentartext ist erforderlich",
		comment_not_found: "Kommentar nicht gefunden",
		comment_review_requires_body: "Ein Kommentar-Review benötigt einen Text",
		commit_not_found: "Commit nicht gefunden",
		contributor_required: "Du musst zu diesem Repository beitragen",
		contributor_required_to_change_issue_state:
			"Du musst zu diesem Repository beitragen, um den Issue-Status zu ändern",
		contributor_required_to_close_pull:
			"Du musst zu diesem Repository beitragen, um einen Pull Request zu schließen",
		contributor_required_to_comment:
			"Du musst zu diesem Repository beitragen, um zu kommentieren",
		contributor_required_to_create_issue:
			"Du musst zu diesem Repository beitragen, um ein Issue zu erstellen",
		contributor_required_to_create_pull:
			"Du musst zu diesem Repository beitragen, um einen Pull Request zu erstellen",
		contributor_required_to_merge_pull:
			"Du musst zu diesem Repository beitragen, um einen Pull Request zu mergen",
		contributor_required_to_reopen_pull:
			"Du musst zu diesem Repository beitragen, um einen Pull Request erneut zu öffnen",
		contributor_required_to_review:
			"Du musst zu diesem Repository beitragen, um zu reviewen",
		contributor_required_to_update_assignees:
			"Du musst zu diesem Repository beitragen, um Zuweisungen zu ändern",
		contributor_required_to_update_issue:
			"Du musst zu diesem Repository beitragen, um ein Issue zu ändern",
		contributor_required_to_update_labels:
			"Du musst zu diesem Repository beitragen, um Labels zu ändern",
		contributor_required_to_update_pull:
			"Du musst zu diesem Repository beitragen, um einen Pull Request zu ändern",
		contributor_required_to_update_reviewers:
			"Du musst zu diesem Repository beitragen, um Reviewer:innen zu ändern",
		current_password_incorrect: "Dein aktuelles Passwort ist falsch",
		current_password_required: "Dein aktuelles Passwort ist erforderlich",
		email_required: "Eine E-Mail-Adresse ist erforderlich",
		failed_to_add_org_owner:
			"Die Besitzer:in konnte nicht als Mitglied hinzugefügt werden",
		failed_to_check_membership:
			"Die Mitgliedschaft konnte nicht geprüft werden",
		failed_to_check_slug: "Der Slug konnte nicht geprüft werden",
		failed_to_create_notification:
			"Die Benachrichtigung konnte nicht erstellt werden",
		failed_to_create_organization:
			"Die Organisation konnte nicht erstellt werden",
		failed_to_create_repository: "Das Repository konnte nicht erstellt werden",
		failed_to_decode_file_content:
			"Der Dateiinhalt konnte nicht dekodiert werden",
		failed_to_decode_webhook_url:
			"Die Webhook-URL konnte nicht dekodiert werden",
		failed_to_delete_account: "Das Konto konnte nicht gelöscht werden",
		failed_to_delete_notification:
			"Die Benachrichtigung konnte nicht gelöscht werden",
		failed_to_delete_organization:
			"Die Organisation konnte nicht gelöscht werden",
		failed_to_delete_organization_repos:
			"Die Repositorys der Organisation konnten nicht gelöscht werden",
		failed_to_encode_response: "Die Antwort konnte nicht kodiert werden",
		failed_to_fetch_account: "Das Konto konnte nicht geladen werden",
		failed_to_fetch_notifications:
			"Die Benachrichtigungen konnten nicht geladen werden",
		failed_to_fetch_organization:
			"Die Organisation konnte nicht geladen werden",
		failed_to_fetch_organization_members:
			"Die Mitglieder der Organisation konnten nicht geladen werden",
		failed_to_fetch_organization_repos:
			"Die Repositorys der Organisation konnten nicht geladen werden",
		failed_to_fetch_organizations:
			"Die Organisationen konnten nicht geladen werden",
		failed_to_fetch_updated_organization:
			"Die Organisation konnte nicht neu geladen werden",
		failed_to_hash_password: "Das Passwort konnte nicht verschlüsselt werden",
		failed_to_join_organization:
			"Der Organisation konnte nicht beigetreten werden",
		failed_to_leave_organization:
			"Die Organisation konnte nicht verlassen werden",
		failed_to_load_appearance:
			"Die Darstellungseinstellungen konnten nicht geladen werden",
		failed_to_load_repository: "Das Repository konnte nicht geladen werden",
		failed_to_read_uploaded_file:
			"Die hochgeladene Datei konnte nicht gelesen werden",
		failed_to_save_appearance:
			"Die Darstellungseinstellungen konnten nicht gespeichert werden",
		failed_to_save_avatar: "Der Avatar konnte nicht gespeichert werden",
		failed_to_scan_notification:
			"Die Benachrichtigung konnte nicht gelesen werden",
		failed_to_set_organization_tags:
			"Die Tags der Organisation konnten nicht gesetzt werden",
		failed_to_store_avatar: "Der Avatar konnte nicht gespeichert werden",
		failed_to_update_email:
			"Die E-Mail-Adresse konnte nicht aktualisiert werden",
		failed_to_update_notification:
			"Die Benachrichtigung konnte nicht aktualisiert werden",
		failed_to_update_organization:
			"Die Organisation konnte nicht aktualisiert werden",
		failed_to_update_password: "Das Passwort konnte nicht aktualisiert werden",
		failed_to_verify_account: "Das Konto konnte nicht überprüft werden",
		failed_to_verify_org_role:
			"Die Rolle in der Organisation konnte nicht überprüft werden",
		failed_to_verify_platform_owner:
			"Die Plattform-Besitzer-Rolle konnte nicht überprüft werden",
		file_not_found: "Datei nicht gefunden",
		file_path_required: "Ein Dateipfad ist erforderlich",
		fork_already_exists: "Du hast bereits einen Fork dieses Repositorys",
		id_required: "Eine ID ist erforderlich",
		image_too_large_2mb:
			"Das Bild ist zu groß. Die maximale Größe beträgt 2 MB",
		image_too_large_5mb:
			"Das Bild ist zu groß. Die maximale Größe beträgt 5 MB",
		incorrect_password: "Das Passwort ist falsch",
		invalid_close_reason: "Ungültiger Schließgrund",
		invalid_comment_id: "Ungültige Kommentar-ID",
		invalid_description: "Ungültige Beschreibung",
		invalid_due_date: "Ungültiges Fälligkeitsdatum",
		invalid_email: "Gib eine gültige E-Mail-Adresse ein",
		invalid_issue_number: "Ungültige Issue-Nummer",
		invalid_issue_state:
			"Der Status muss entweder „offen“ oder „geschlossen“ sein",
		invalid_label_id: "Ungültige Label-ID",
		invalid_labels: "Ungültige Labels",
		invalid_language: "Diese Sprache wird nicht unterstützt",
		invalid_limit: "Ungültiges Limit",
		invalid_organization_status:
			"Der Status muss entweder „aktiv“ oder „ausgesetzt“ sein",
		invalid_organization_visibility:
			"Die Sichtbarkeit muss entweder „öffentlich“ oder „mitglieder“ sein",
		invalid_page: "Ungültige Seite",
		invalid_pull_request_number: "Ungültige Pull-Request-Nummer",
		invalid_purpose: "Ungültiger Zweck",
		invalid_request_body: "Ungültiger Anfrage-Inhalt",
		invalid_review_id: "Ungültige Review-ID",
		invalid_review_state:
			"Der Review-Status muss comment, approved oder changes_requested sein",
		invalid_theme: "Ungültiges Design",
		invalid_title: "Ungültiger Titel",
		invalid_todo_id: "Ungültige To-do-ID",
		invalid_year: "Ungültiges Jahr",
		issue_not_found: "Issue nicht gefunden",
		label_name_required: "Ein Label-Name ist erforderlich",
		merge_commit_not_found: "Hash des Merge-Commits nicht gefunden",
		method_not_allowed: "Methode nicht erlaubt",
		missing_avatar_file: "Es wurde keine Avatar-Datei übermittelt",
		missing_base_head_params:
			"Die Query-Parameter „base“ und „head“ sind erforderlich",
		missing_image_file: "Es wurde keine Bilddatei übermittelt",
		missing_logo_file: "Es wurde keine Logo-Datei übermittelt",
		missing_required_parameters: "Erforderliche Parameter fehlen",
		missing_required_path_parameters: "Erforderliche Pfadparameter fehlen",
		missing_source_target_params:
			"Die Query-Parameter für Quelle und Ziel sind erforderlich",
		new_password_required: "Ein neues Passwort ist erforderlich",
		no_password_set: "Für dieses Konto ist kein Passwort hinterlegt",
		no_settings_provided: "Es wurden keine Einstellungen übermittelt",
		not_an_organization_member: "Du bist kein Mitglied dieser Organisation",
		not_authenticated: "Nicht angemeldet",
		only_merged_pull_revertible:
			"Nur gemergte Pull Requests können zurückgenommen werden",
		only_owner_manages_backups:
			"Nur die Besitzer:in des Repositorys kann Backups verwalten",
		org_owner_cannot_leave:
			"Die Besitzer:in einer Organisation kann diese nicht verlassen",
		org_owner_or_admin_required:
			"Nur die Besitzer:in oder Admins der Organisation können das tun",
		org_owner_required: "Nur die Besitzer:in der Organisation kann das tun",
		organization_name_required: "Ein Organisationsname ist erforderlich",
		organization_name_taken: "Dieser Organisationsname ist bereits vergeben",
		organization_name_too_long:
			"Der Organisationsname darf höchstens 100 Zeichen lang sein",
		organization_not_found: "Organisation nicht gefunden",
		password_required: "Ein Passwort ist erforderlich",
		password_too_short: "Das neue Passwort muss mindestens 8 Zeichen lang sein",
		pull_request_not_found: "Pull Request nicht gefunden",
		pull_request_not_open: "Dieser Pull Request ist nicht offen",
		repository_already_exists: "Dieses Repository existiert bereits",
		repository_is_private: "Dieses Repository ist privat",
		repository_name_leading_space:
			"Der Repository-Name darf nicht mit einem Leerzeichen beginnen",
		repository_name_required: "Ein Repository-Name ist erforderlich",
		repository_not_found: "Repository nicht gefunden",
		repository_not_found_or_no_commits:
			"Repository nicht gefunden oder ohne Commits",
		sign_in_required: "Du musst angemeldet sein",
		sign_in_required_to_change_issue_state:
			"Du musst angemeldet sein, um den Issue-Status zu ändern",
		sign_in_required_to_close_pull:
			"Du musst angemeldet sein, um einen Pull Request zu schließen",
		sign_in_required_to_comment: "Du musst angemeldet sein, um zu kommentieren",
		sign_in_required_to_create_issue:
			"Du musst angemeldet sein, um ein Issue zu erstellen",
		sign_in_required_to_create_pull:
			"Du musst angemeldet sein, um einen Pull Request zu erstellen",
		sign_in_required_to_delete_issue:
			"Du musst angemeldet sein, um ein Issue zu löschen",
		sign_in_required_to_delete_review:
			"Du musst angemeldet sein, um ein Review zu löschen",
		sign_in_required_to_merge_pull:
			"Du musst angemeldet sein, um einen Pull Request zu mergen",
		sign_in_required_to_modify_comment:
			"Du musst angemeldet sein, um einen Kommentar zu ändern",
		sign_in_required_to_reopen_pull:
			"Du musst angemeldet sein, um einen Pull Request wieder zu öffnen",
		sign_in_required_to_revert_pull:
			"Du musst angemeldet sein, um einen Pull Request zurückzunehmen",
		sign_in_required_to_review:
			"Du musst angemeldet sein, um ein Review abzugeben",
		sign_in_required_to_update_assignees:
			"Du musst angemeldet sein, um Zuweisungen zu ändern",
		sign_in_required_to_update_issue:
			"Du musst angemeldet sein, um ein Issue zu ändern",
		sign_in_required_to_update_labels:
			"Du musst angemeldet sein, um Labels zu ändern",
		sign_in_required_to_update_pull:
			"Du musst angemeldet sein, um einen Pull Request zu ändern",
		sign_in_required_to_update_reviewers:
			"Du musst angemeldet sein, um Reviewer:innen zu ändern",
		sign_in_required_to_upload:
			"Du musst angemeldet sein, um Bilder hochzuladen",
		slug_required: "Ein Slug ist erforderlich",
		source_branch_not_found: "Quell-Branch nicht gefunden",
		source_branch_required: "Ein Quell-Branch ist erforderlich",
		system_metrics_starting_up: "Die Systemmetriken starten noch",
		tag_not_found: "Tag nicht gefunden",
		target_branch_not_found: "Ziel-Branch nicht gefunden",
		target_branch_required: "Ein Ziel-Branch ist erforderlich",
		title_required: "Ein Titel ist erforderlich",
		title_too_long: "Der Titel darf höchstens 200 Zeichen lang sein",
		todo_not_found: "To-do nicht gefunden",
		unsupported_archive_format: "Nicht unterstütztes Archivformat",
		unsupported_image_type:
			"Nicht unterstützter Dateityp. Bitte lade ein PNG-, JPG-, WebP- oder GIF-Bild hoch",
		uploaded_file_empty: "Die hochgeladene Datei ist leer",
		user_not_found: "Benutzer:in nicht gefunden",
		username_required: "Ein Benutzername ist erforderlich",
		webhook_not_found: "Webhook nicht gefunden",
		webhook_url_required: "Eine Webhook-URL ist erforderlich",
	},
} as const;
