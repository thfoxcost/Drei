/** Sign-in / sign-up screens and the shared auth form vocabulary. */
export const auth = {
	divider: "OR",
	email: {
		label: "Email",
		placeholder: "example@email.com",
		invalid: "invalid email",
	},
	password: {
		label: "Password",
		placeholder: "Password",
		tooShort: "Password must be at least 8 characters.",
	},
	name: {
		label: "Name",
		placeholder: "Jane Doe",
		tooShort: "Name must be at least 2 characters.",
		leadingSpace: "Name cannot start with a space",
	},
	logoAlt: "logo",

	signIn: {
		submit: "Continue With Email",
		withGitHub: "GitHub",
		noAccount: "Don't have an account?",
		signUpLink: "Sign up",
		welcome: "Welcome Back !",
	},

	signUp: {
		submit: "Create Account",
		withGitHub: "Sign up with GitHub",
		hasAccount: "Already have an account?",
		signInLink: "Sign in",
		created: "Account created!",
	},

	account: {
		title: "Account Settings",
		loading: "Loading account...",
		emailHeading: "Email",
		emailLabel: "Email Address",
		emailPlaceholder: "name@example.com",
		emailDescription: "This email address will be used for your account.",
		emailUpdated: "Email updated",
		emailRequired: "Email cannot be empty",
		emailUpdateFailed: "Failed to update email",
		updateEmail: "Update Email",
		updating: "Updating...",

		passwordHeading: "Password",
		passwordLabel: "Password",
		currentPassword: "Current Password",
		currentPasswordPlaceholder: "Enter your current password",
		newPassword: "New Password",
		newPasswordPlaceholder: "Enter your new password",
		confirmNewPassword: "Confirm New Password",
		confirmNewPasswordPlaceholder: "Confirm your new password",
		changePassword: "Change Password",
		changing: "Changing...",
		passwordChanged: "Password changed",
		passwordChangeFailed: "Failed to change password",
		enterCurrentPassword: "Please enter your current password",
		enterNewPassword: "Please enter a new password",
		newPasswordTooShort: "New password must be at least 8 characters",
		passwordsDoNotMatch: "New passwords do not match",
		enterPassword: "Please enter your password",
		confirmPasswordLabel: "Confirm your password",
		confirmPasswordPlaceholder: "Enter your password",
		confirmPasswordHelp:
			"Enter your password to confirm that you want to permanently delete your account.",

		dangerHeading: "Danger Zone",
		deleteLabel: "Delete your account",
		deleteHelp:
			"Permanently delete your account and all associated data. This action cannot be undone.",
		deleteButton: "Delete account",
		deleteDialogTitle: "Delete your account?",
		deleteDialogDescription:
			"This action cannot be undone. This will permanently delete your account and all of your associated data.",
		deleteConfirm: "Delete my account",
		deleting: "Deleting...",
		deleted: "Account deleted successfully",
		deleteFailed: "Failed to delete account",
		loadFailed: "Failed to load account data",
	},
} as const;
