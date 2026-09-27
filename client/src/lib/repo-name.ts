/**
 * Repository name validation, mirroring gitrepo.ValidRepoName in the Go
 * backend (backend/internal/gitrepo/init.go).
 *
 * The backend is the authority: a name that fails here is still rejected
 * server-side. This exists so the create form explains the rule before the
 * request is made, instead of returning a 400 after the fact.
 */

/** Maximum length, matching the backend's `len(name) > 30` check. */
export const REPO_NAME_MAX_LENGTH = 30;

const ALLOWED_CHARACTERS = /^[a-zA-Z0-9._-]+$/;

/**
 * Reports whether name is an acceptable repository name.
 *
 * The rules, in the backend's order:
 *   - non-empty and at most 30 characters
 *   - must not begin with "-" or "." (git treats these specially)
 *   - must not end with "."
 *   - only letters, digits, dot, dash and underscore
 *
 * The backend measures length in bytes and this measures UTF-16 code units.
 * The two agree for every accepted name because the character allowlist is
 * ASCII-only, so any name where they could disagree is already rejected.
 */
export function isValidRepoName(name: string): boolean {
	if (name.length === 0 || name.length > REPO_NAME_MAX_LENGTH) {
		return false;
	}

	if (name.startsWith("-") || name.startsWith(".") || name.endsWith(".")) {
		return false;
	}

	return ALLOWED_CHARACTERS.test(name);
}

/**
 * The same rule as a single anchored regular expression, for the HTML
 * `pattern` attribute, which cannot call a function.
 *
 * The first character class excludes "-" and "." and the last excludes ".",
 * which together enforce the prefix and suffix rules; the bounded repetition
 * enforces the length range of 1 to 30.
 */
export const REPO_NAME_PATTERN =
	"[a-zA-Z0-9_](?:[a-zA-Z0-9._-]{0,28}[a-zA-Z0-9_-])?";

/** A human-readable explanation of REPO_NAME_PATTERN, shown by the browser. */
export const REPO_NAME_HINT =
	"Use 1-30 letters, numbers, dots, dashes or underscores. Cannot start with a dash or dot, or end with a dot.";

/**
 * Explains why isValidRepoName rejected name, or returns null when it is
 * acceptable. Ordered so the most specific problem is reported first.
 */
export function repoNameError(name: string): string | null {
	if (name.length === 0) {
		return "Repository name is required";
	}

	if (name.length > REPO_NAME_MAX_LENGTH) {
		return `Repository name must be at most ${REPO_NAME_MAX_LENGTH} characters`;
	}

	if (!ALLOWED_CHARACTERS.test(name)) {
		return "Repository name may only contain letters, numbers, dots, dashes and underscores";
	}

	if (name.startsWith("-") || name.startsWith(".")) {
		return "Repository name cannot start with a dash or a dot";
	}

	if (name.endsWith(".")) {
		return "Repository name cannot end with a dot";
	}

	return null;
}
