import { useTranslation } from "react-i18next"

export type TodoStatus = "undone" | "progress" | "done" | "discarded"

/**
 * Translation keys rather than copy, so a language switch re-renders instead of
 * leaving stale English behind. Render sites call `t()` on the matching key.
 */
export const TODO_STATUS_LABEL_KEY: Record<TodoStatus, string> = {
  undone: "todos.status.undone",
  progress: "todos.status.progress",
  done: "todos.status.done",
  discarded: "todos.status.discarded",
}

const PATHS: Record<TodoStatus, React.ReactNode> = {
  undone: <circle cx="12" cy="12" r="9" />,
  progress: (
    <>
      <path d="M8.56 3.69a9 9 0 0 0-2.92 1.95M3.69 8.56A9 9 0 0 0 3 12m.69 3.44a9 9 0 0 0 1.95 2.92m2.92 1.95A9 9 0 0 0 12 21m3.44-.69a9 9 0 0 0 2.92-1.95m1.95-2.92A9 9 0 0 0 21 12m-.69-3.44a9 9 0 0 0-1.95-2.92m-2.92-1.95A9 9 0 0 0 12 3" />
    </>
  ),
  done: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12l2 2l4-4" />
    </>
  ),
  discarded: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 10l4 4m0-4l-4 4" />
    </>
  ),
}

const STATUS_CLASS: Record<TodoStatus, string> = {
  undone: "text-muted-foreground",
  progress: "text-warning",
  done: "text-success",
  discarded: "text-destructive",
}

export function TodoStatusIcon({
  status,
  className,
  ...props
}: { status: TodoStatus } & React.ComponentProps<"svg">) {
  const { t } = useTranslation()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-slot="todo-status-icon"
      className={["size-4 shrink-0", STATUS_CLASS[status], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <title>{t(TODO_STATUS_LABEL_KEY[status])}</title>
      {PATHS[status]}
    </svg>
  )
}
