import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation } from "@tanstack/react-router"
import { toast } from "sonner"
import { authClient } from "#/lib/auth-client"
import { CopyDialog } from "@/components/copy-dialog"
import { matchesRepo, TODO_FIRED_KEY, TODO_OPENED_KEY, type Reminder, type TodoItem } from "@/components/todo-types"
import {
  useCreateTodo,
  useDeleteTodo,
  useTodos,
  useUpdateTodo,
} from "#/hooks/useTodos"

type TodoContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  items: TodoItem[]
  addItem: (title: string) => void
  patchItem: (id: string, changes: Partial<TodoItem>) => void
  removeItem: (id: string) => void
  duplicateItem: (item: TodoItem) => void
  setReminder: (id: string, reminder: Reminder | null) => void
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode); reminders stay in memory.
  }
}

/** A fresh browser session means a real app open, not a logout/login cycle. */
function isFreshSession(): boolean {
  try {
    if (window.sessionStorage.getItem(TODO_OPENED_KEY)) return false

    window.sessionStorage.setItem(TODO_OPENED_KEY, "1")

    return true
  } catch {
    return false
  }
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { data: items = [] } = useTodos()
  const queryClient = useQueryClient()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const [fired, setFired] = useState<Record<string, true>>(() =>
    readJson<Record<string, true>>(TODO_FIRED_KEY, {}),
  )
  const pathname = useLocation({ select: (state) => state.pathname })
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const knownUser = useRef<string | undefined>(undefined)
  const nextOpenChecked = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.toLowerCase() !== "r") return
      if (isTypingTarget(e.target)) return

      e.preventDefault()
      setOpen((prev) => !prev)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // To-dos are per user, so a sign-in as somebody else must not reuse the
  // previous account's cache or "already reminded" bookkeeping.
  useEffect(() => {
    if (!userId) return

    if (knownUser.current === undefined) {
      knownUser.current = userId
      return
    }

    if (knownUser.current === userId) return

    knownUser.current = userId
    queryClient.removeQueries({ queryKey: ["todos"] })
    setFired({})
    writeJson(TODO_FIRED_KEY, {})
  }, [userId, queryClient])

  // Every mutation writes to the query cache first so the list reacts
  // instantly, then reconciles with the row the API returns.
  const patchItem = useCallback(
    (id: string, changes: Partial<TodoItem>) => {
      queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) =>
        prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      )

      updateTodo.mutate({
        id,
        changes: {
          ...(changes.title !== undefined ? { title: changes.title } : {}),
          ...(changes.status !== undefined ? { status: changes.status } : {}),
          ...(changes.pinned !== undefined ? { pinned: changes.pinned } : {}),
          // An empty kind is how the API is told to clear the reminder.
          ...(changes.reminder !== undefined
            ? { reminder: changes.reminder ?? { kind: "" } }
            : {}),
        },
      })
    },
    [queryClient, updateTodo],
  )

  const removeItem = useCallback(
    (id: string) => {
      queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) =>
        prev.filter((item) => item.id !== id),
      )

      deleteTodo.mutate(id)
    },
    [deleteTodo, queryClient],
  )

  const addItem = useCallback(
    (title: string) => {
      const item: TodoItem = {
        id: crypto.randomUUID(),
        title,
        status: "undone",
        pinned: false,
        createdAt: new Date().toISOString(),
        reminder: null,
      }

      queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) => [
        item,
        ...(prev ?? []),
      ])

      createTodo.mutate(item)
    },
    [createTodo, queryClient],
  )

  const duplicateItem = useCallback(
    (item: TodoItem) => {
      addItem(item.title)
    },
    [addItem],
  )

  const setReminder = useCallback(
    (id: string, reminder: Reminder | null) => {
      patchItem(id, { reminder })

      setFired((prev) => {
        if (!prev[id]) return prev

        const next = { ...prev }
        delete next[id]
        writeJson(TODO_FIRED_KEY, next)

        return next
      })
    },
    [patchItem],
  )

  const snooze = useCallback(
    (item: TodoItem) => {
      toast.dismiss(`todo-reminder-${item.id}`)

      if (item.reminder?.kind === "time") {
        patchItem(item.id, {
          reminder: {
            kind: "time",
            at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          },
        })
      }

      setFired((prev) => {
        const next = { ...prev }
        delete next[item.id]
        writeJson(TODO_FIRED_KEY, next)

        return next
      })
    },
    [patchItem],
  )

  const fire = useCallback(
    (item: TodoItem) => {
      setFired((prev) => {
        if (prev[item.id]) return prev

        const next = { ...prev, [item.id]: true as const }
        writeJson(TODO_FIRED_KEY, next)

        return next
      })

      toast(item.title, {
        id: `todo-reminder-${item.id}`,
        description: "To-do reminder",
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: "Remind me later",
          onClick: () => snooze(item),
        },
      })
    },
    [snooze],
  )

  // "Next time I open the app" — fires once per fresh browser session, so a
  // logout/login round trip does not count as opening the app again. The check
  // waits for the first list load and then never runs again, because the
  // session flag is what makes it a one-shot.
  useEffect(() => {
    if (nextOpenChecked.current) return
    if (!userId || items.length === 0) return

    nextOpenChecked.current = true

    if (!isFreshSession()) return

    for (const item of items) {
      if (item.reminder?.kind === "next-open" && !fired[item.id]) fire(item)
    }
  }, [userId, items, fired, fire])

  // "At a time" — polled so long offsets survive setTimeout's 24.8 day cap.
  useEffect(() => {
    function check() {
      const now = Date.now()

      for (const item of items) {
        if (item.reminder?.kind !== "time" || !item.reminder.at) continue
        if (fired[item.id]) continue
        if (new Date(item.reminder.at).getTime() > now) continue

        fire(item)
      }
    }

    check()
    const id = window.setInterval(check, 15_000)

    return () => window.clearInterval(id)
  }, [items, fired, fire])

  // "When I open <owner>/<repo>" — one specific repository, repo tabs included.
  useEffect(() => {
    for (const item of items) {
      const reminder = item.reminder

      if (reminder?.kind !== "repo-page" || !reminder.repo) continue
      if (fired[item.id]) continue
      if (!matchesRepo(pathname, reminder.repo.owner, reminder.repo.name)) {
        continue
      }

      fire(item)
    }
  }, [pathname, items, fired, fire])

  return (
    <TodoContext.Provider
      value={{
        open,
        setOpen,
        toggle: () => setOpen((prev) => !prev),
        items,
        addItem,
        patchItem,
        removeItem,
        duplicateItem,
        setReminder,
      }}
    >
      {children}
      <CopyDialog />
    </TodoContext.Provider>
  )
}

const TodoContext = createContext<TodoContextValue | null>(null)

export function useTodo(): TodoContextValue {
  const context = useContext(TodoContext)

  if (!context) {
    throw new Error("useTodo must be used within a TodoProvider")
  }

  return context
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}
