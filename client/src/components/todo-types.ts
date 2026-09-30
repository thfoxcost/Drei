import { i18n } from "#/i18n/i18n";
import { formatDateTime } from "#/i18n/lib/format";
import type { TodoStatus } from "@/components/todo-status-icon";

export type ReminderKind = "next-open" | "time" | "repo-page";

export type Reminder = {
	kind: ReminderKind;
	/** ISO timestamp, only used by the "time" reminder. */
	at?: string;
	/** Target repository, only used by the "repo-page" reminder. */
	repo?: { owner: string; name: string };
};

export type TodoItem = {
	id: string;
	title: string;
	status: TodoStatus;
	pinned: boolean;
	createdAt: string;
	reminder: Reminder | null;
};

export const TODO_ITEMS_KEY = "drei.todos.items.v1";
export const TODO_FIRED_KEY = "drei.todos.fired.v1";
export const TODO_OPENED_KEY = "drei.todos.opened.v1";

/**
 * Translation keys rather than copy, so a language switch re-renders instead of
 * leaving stale English behind.
 */
export const REMINDER_LABEL_KEY = {
	"next-open": "todos.reminder.nextOpen",
	time: "todos.reminder.atTimeShort",
	"repo-page": "todos.reminder.onRepoPageShort",
} as const satisfies Record<ReminderKind, string>;

/** Minimal shape of i18next's `t`, so callers can pass the hook's result. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

export function reminderSummary(
	reminder: Reminder | null,
	t: Translate = (key) => i18n.t(key as Parameters<typeof i18n.t>[0]) as string,
): string | null {
	if (!reminder) return null;

	if (reminder.kind === "time" && reminder.at) {
		return t("todos.reminder.summaryAt", {
			date: formatDateTime(new Date(reminder.at)),
		});
	}

	if (reminder.kind === "repo-page" && reminder.repo) {
		return t("todos.reminder.summaryOn", {
			repo: `${reminder.repo.owner}/${reminder.repo.name}`,
		});
	}

	return t(REMINDER_LABEL_KEY[reminder.kind]);
}

/** Repo pages live at `/{username}/{repo}`; extra segments are repo tabs. */
export function matchesRepo(
	pathname: string,
	owner: string,
	name: string,
): boolean {
	const [segmentOwner, segmentName] = pathname.split("/").filter(Boolean);

	return (
		segmentOwner?.toLowerCase() === owner.toLowerCase() &&
		segmentName?.toLowerCase() === name.toLowerCase()
	);
}
