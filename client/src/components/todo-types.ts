import type { TodoStatus } from "@/components/todo-status-icon"

export type ReminderKind = "next-open" | "time" | "repo-page"

export type Reminder = {
  kind: ReminderKind
  /** ISO timestamp, only used by the "time" reminder. */
  at?: string
  /** Target repository, only used by the "repo-page" reminder. */
  repo?: { owner: string; name: string }
}

export type TodoItem = {
  id: string
  title: string
  status: TodoStatus
  pinned: boolean
  createdAt: string
  reminder: Reminder | null
}

export const TODO_ITEMS_KEY = "drei.todos.items.v1"
export const TODO_FIRED_KEY = "drei.todos.fired.v1"
export const TODO_OPENED_KEY = "drei.todos.opened.v1"

export const REMINDER_LABEL: Record<ReminderKind, string> = {
  "next-open": "Next app open",
  time: "At a time",
  "repo-page": "On a repo page",
}

export function reminderSummary(reminder: Reminder | null): string | null {
  if (!reminder) return null

  if (reminder.kind === "time" && reminder.at) {
    return `At ${new Date(reminder.at).toLocaleString()}`
  }

  if (reminder.kind === "repo-page" && reminder.repo) {
    return `On ${reminder.repo.owner}/${reminder.repo.name}`
  }

  return REMINDER_LABEL[reminder.kind]
}

/** Repo pages live at `/{username}/{repo}`; extra segments are repo tabs. */
export function matchesRepo(
  pathname: string,
  owner: string,
  name: string,
): boolean {
  const [segmentOwner, segmentName] = pathname.split("/").filter(Boolean)

  return (
    segmentOwner?.toLowerCase() === owner.toLowerCase() &&
    segmentName?.toLowerCase() === name.toLowerCase()
  )
}
