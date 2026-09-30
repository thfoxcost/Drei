import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bell,
  BellOff,
  BookMarked,
  CircleCheck,
  CircleDot,
  Ellipsis,
  Pencil,
  Pin,
  PinOff,
  Plus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field } from "@/components/ui/field"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TODO_STATUS_LABEL_KEY,
  TodoStatusIcon,
  type TodoStatus,
} from "@/components/todo-status-icon"
import { useUsers } from "#/hooks/useUsers"
import useUserRepos from "#/hooks/useUserRepos"
import { PersonPreviewCard } from "@/components/people/person-preview-card"
import { useTodo } from "@/components/todo-provider"
import { reminderSummary, type TodoItem } from "@/components/todo-types"
import { dateFnsLocale } from "#/i18n/lib/format"

type TodoTab = "undone" | "done"

type Trigger = {
  kind: "user" | "repo"
  start: number
  query: string
}

type Suggestion = {
  id: string
  label: string
  insert: string
}

const TAB_STATUSES: Record<TodoTab, TodoStatus[]> = {
  undone: ["undone", "progress"],
  done: ["done", "discarded"],
}

const STATUS_CYCLE: TodoStatus[] = ["undone", "progress", "done", "discarded"]

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const ROW_CLASS: Record<TodoStatus, string> = {
  undone: "",
  progress: "",
  done: "text-muted-foreground line-through",
  discarded: "text-muted-foreground line-through opacity-60",
}

export function CopyDialog() {
  const { t } = useTranslation()
  const {
    open,
    setOpen: onOpenChange,
    items,
    addItem: createItem,
    patchItem,
    removeItem,
    duplicateItem,
    setReminder,
  } = useTodo()
  const [tab, setTab] = useState<TodoTab>("undone")
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState("")
  const [draftInput, setDraftInput] = useState<HTMLInputElement | null>(null)
  const [trigger, setTrigger] = useState<Trigger | null>(null)
  const [triggerIndex, setTriggerIndex] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [reminderFor, setReminderFor] = useState<TodoItem | null>(null)
  const [reminderAt, setReminderAt] = useState("")
  const [repoPickerFor, setRepoPickerFor] = useState<TodoItem | null>(null)
  const [repoQuery, setRepoQuery] = useState("")

  const { data: users = [] } = useUsers()
  const { repos } = useUserRepos()

  const mentionList = useMemo(() => {
    if (trigger?.kind !== "user") return []

    const q = trigger.query.toLowerCase()

    return users
      .filter((user) => !q || user.username.toLowerCase().includes(q))
      .slice(0, 6)
  }, [trigger, users])

  const repoList = useMemo(() => {
    if (trigger?.kind !== "repo") return []

    const q = trigger.query.toLowerCase()

    return repos
      .filter(
        (repo) =>
          !q ||
          repo.name.toLowerCase().includes(q) ||
          repo.owner.toLowerCase().includes(q),
      )
      .slice(0, 6)
  }, [trigger, repos])

  const repoPickerList = useMemo(() => {
    const q = repoQuery.trim().toLowerCase()

    return repos
      .filter(
        (repo) =>
          !q ||
          repo.name.toLowerCase().includes(q) ||
          repo.owner.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [repoQuery, repos])

  const options: Suggestion[] =
    trigger?.kind === "repo"
      ? repoList.map((repo) => ({
          id: `${repo.owner}/${repo.name}`,
          label: `${repo.owner}/${repo.name}`,
          insert: `#${repo.name}`,
        }))
      : mentionList.map((user) => ({
          id: user.id || user.username,
          label: user.username,
          insert: `@${user.username}`,
        }))

  function syncTrigger(value: string, caret: number) {
    const match = value.slice(0, caret).match(/([@#])([\w./-]*)$/)

    setTrigger(
      match
        ? {
            kind: match[1] === "@" ? "user" : "repo",
            start: caret - match[0].length,
            query: match[2],
          }
        : null,
    )
    setTriggerIndex(0)
  }

  function applySuggestion(option: Suggestion) {
    if (!trigger) return

    const caret = draftInput?.selectionStart ?? draft.length
    const next =
      draft.slice(0, trigger.start) + option.insert + " " + draft.slice(caret)

    setDraft(next)
    setTrigger(null)
    draftInput?.focus()
  }

  function handleDraftKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (trigger && options.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setTriggerIndex((i) => (i + 1) % options.length)
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setTriggerIndex((i) => (i - 1 + options.length) % options.length)
        return
      }

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        applySuggestion(options[triggerIndex])
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        setTrigger(null)
        return
      }
    }

    if (e.key === "Enter") {
      e.preventDefault()
      addItem()
    }
  }

  const query = search.trim().toLowerCase()

  const counts = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(TAB_STATUSES) as TodoTab[]).map((key) => [
          key,
          items.filter((item) => TAB_STATUSES[key].includes(item.status)).length,
        ]),
      ) as Record<TodoTab, number>,
    [items],
  )

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          TAB_STATUSES[tab].includes(item.status) &&
          (!query || item.title.toLowerCase().includes(query)),
      ),
    [items, tab, query],
  )

  useEffect(() => {
    if (!open) {
      setTrigger(null)
      return
    }

    const frame = requestAnimationFrame(() => draftInput?.focus())

    return () => cancelAnimationFrame(frame)
  }, [open, draftInput])

  const pinned = visible.filter((item) => item.pinned)
  const rest = visible.filter((item) => !item.pinned)

  function patch(id: string, changes: Partial<TodoItem>) {
    patchItem(id, changes)
  }

  function startEditing(item: TodoItem) {
    setEditingId(item.id)
    setEditDraft(item.title)
  }

  function saveEditing() {
    if (!editingId) return

    const title = editDraft.trim()

    if (title) patch(editingId, { title })

    setEditingId(null)
    setEditDraft("")
  }

  function cancelEditing() {
    setEditingId(null)
    setEditDraft("")
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      saveEditing()
      return
    }

    if (e.key === "Escape") {
      e.preventDefault()
      cancelEditing()
    }
  }

  function cycleStatus(id: string) {
    const item = items.find((row) => row.id === id)

    if (!item) return

    patchItem(id, {
      status:
        STATUS_CYCLE[
          (STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length
        ],
    })
  }

  function renderRow(item: TodoItem) {
    const nextStatus =
      STATUS_CYCLE[
        (STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length
      ]

    return (
      <li key={item.id} className="group flex items-center gap-1.5 px-0.5 py-0.5">
        <button
          type="button"
          onClick={() => cycleStatus(item.id)}
          title={t("todos.markAsStatus", {
            status: t(TODO_STATUS_LABEL_KEY[nextStatus]),
          })}
          aria-label={t("todos.statusLabel", { status: t(TODO_STATUS_LABEL_KEY[item.status]) })}
          className="rounded-full p-0.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <TodoStatusIcon status={item.status} />
        </button>

        {editingId === item.id ? (
          <Input
            autoFocus
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={handleEditKeyDown}
            aria-label={t("nav.todos.edit")}
            className="h-6 min-w-0 flex-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => startEditing(item)}
            title={t("todos.edit")}
            className={`min-w-0 flex-1 truncate text-left text-sm ${
              ROW_CLASS[item.status]
            }`}
          >
            {item.title}
          </button>
        )}

        {item.reminder && (
          <Bell
            className="size-3 shrink-0 text-warning"
            aria-label={reminderSummary(item.reminder, t) ?? t("nav.todos.reminderSet")}
          />
        )}

        <div className="relative flex shrink-0 items-center">
          <time
            dateTime={item.createdAt}
            title={t("todos.reminder.created", {
              date: format(new Date(item.createdAt), "PPpp", { locale: dateFnsLocale() }),
            })}
            className={`text-xs text-muted-foreground tabular-nums transition-opacity group-hover:opacity-0 ${
              editingId === item.id ? "invisible" : ""
            }`}
          >
            {format(new Date(item.createdAt), "MMM d", { locale: dateFnsLocale() })}
          </time>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("nav.todos.actionsFor", { title: item.title })}
                className="absolute right-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => startEditing(item)}>
                <Pencil className="mr-1.5 size-4" />
                {t("todos.edit")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => patch(item.id, { pinned: !item.pinned })}
              >
                {item.pinned ? (
                  <PinOff className="mr-1.5 size-4" />
                ) : (
                  <Pin className="mr-1.5 size-4" />
                )}
                {item.pinned ? t("todos.unpin") : t("todos.pin")}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TodoStatusIcon status={item.status} className="mr-1.5" />
                  {t("todos.markAs")}
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent>
                  {STATUS_CYCLE.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onSelect={() => patch(item.id, { status })}
                    >
                      <TodoStatusIcon status={status} className="mr-1.5" />
                      {t(TODO_STATUS_LABEL_KEY[status])}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {item.reminder ? (
                    <Bell className="mr-1.5 size-4" />
                  ) : (
                    <BellOff className="mr-1.5 size-4" />
                  )}
                  {t("todos.reminder.remindMe")}
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => setReminder(item.id, { kind: "next-open" })}
                  >
                    {t("todos.reminder.nextOpen")}
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => openRepoPicker(item)}>
                    {item.reminder?.kind === "repo-page"
                      ? t("todos.reminder.changeRepoPage")
                      : t("todos.reminder.onRepoPage")}
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => openTimePicker(item)}>
                    {item.reminder?.kind === "time"
                      ? t("todos.reminder.changeTime")
                      : t("todos.reminder.atTime")}
                  </DropdownMenuItem>

                  {item.reminder && (
                    <>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-muted-foreground"
                        onSelect={() => setReminder(item.id, null)}
                      >
                        {t("todos.reminder.clear")}
                        <span className="ml-auto text-xs">
                          {reminderSummary(item.reminder, t)}
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onSelect={() => duplicateItem(item)}>
                {t("nav.todos.duplicate")}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => removeItem(item.id)}
              >
                {t("common.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    )
  }

  function renderSection(label: string, list: TodoItem[], spaced = false) {
    if (list.length === 0) return null

    return (
      <>
        <li
          className={`px-1 pb-0.5 text-xs text-muted-foreground ${
            spaced ? "pt-2" : "pt-1"
          }`}
        >
          {label}
        </li>

        {list.map(renderRow)}
      </>
    )
  }

  function addItem() {
    const title = draft.trim()

    if (!title) return

    createItem(title)
    setDraft("")
    setTab("undone")
  }

  function openTimePicker(item: TodoItem) {
    const fallback = new Date(Date.now() + 60 * 60 * 1000)
    const current = item.reminder?.at
      ? new Date(item.reminder.at)
      : fallback

    setReminderAt(toLocalInputValue(current))
    setReminderFor(item)
  }

  function openRepoPicker(item: TodoItem) {
    setRepoQuery("")
    setRepoPickerFor(item)
  }

  function saveRepoReminder(repo: { owner: string; name: string }) {
    if (!repoPickerFor) return

    setReminder(repoPickerFor.id, { kind: "repo-page", repo })
    setRepoPickerFor(null)
  }

  function saveTimeReminder() {
    if (!reminderFor || !reminderAt) return

    const at = new Date(reminderAt)

    if (Number.isNaN(at.getTime())) return

    setReminder(reminderFor.id, { kind: "time", at: at.toISOString() })
    setReminderFor(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-1.5 sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="sr-only">{t("nav.todos.viewTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-row items-center justify-between gap-2">
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setTab(value === "done" ? "done" : "undone")
            }
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="undone">
                <CircleDot />
                {t("nav.todos.undone", { count: counts.undone })}
              </TabsTrigger>

              <TabsTrigger value="done">
                <CircleCheck />
                {t("nav.todos.done", { count: counts.done })}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Field className="w-full">
            <InputGroup className="h-7">
              <InputGroupInput
                placeholder={t("common.states.typeToSearch")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </Field>
        </div>

        <ul className="mt-0.5 flex max-h-56 flex-col overflow-y-auto">
          {visible.length === 0 ? (
            <li className="px-1 py-2 text-sm text-muted-foreground">
              {query ? t("nav.todos.noMatches") : t("nav.todos.empty")}
            </li>
          ) : (
            <>
              {renderSection(t("nav.todos.sectionPinned"), pinned)}
              {renderSection(rest.length ? t("nav.todos.sectionRest") : "", rest, true)}
            </>
          )}
        </ul>

        <div className="relative mt-2 flex items-center gap-1.5">
          {trigger && options.length > 0 && (
            <ul className="absolute bottom-full left-0 z-10 mb-1 w-full overflow-hidden rounded-lg border bg-popover p-0.5 shadow-md">
              {trigger.kind === "user"
                ? mentionList.map((user, index) => (
                    <li key={user.id || user.username}>
                      <HoverCard openDelay={200} closeDelay={80}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              applySuggestion({
                                id: user.id || user.username,
                                label: user.username,
                                insert: `@${user.username}`,
                              })
                            }}
                            onMouseEnter={() => setTriggerIndex(index)}
                            className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm ${
                              index === triggerIndex ? "bg-muted" : ""
                            }`}
                          >
                            <Avatar size="sm">
                              {user.avatar ? (
                                <AvatarImage
                                  src={user.avatar}
                                  alt={user.username}
                                />
                              ) : null}
                              <AvatarFallback>
                                {user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <span className="truncate">{user.username}</span>
                          </button>
                        </HoverCardTrigger>

                        <HoverCardContent
                          side="top"
                          align="start"
                          className="w-auto p-2.5"
                        >
                          <PersonPreviewCard username={user.username} />
                        </HoverCardContent>
                      </HoverCard>
                    </li>
                  ))
                : repoList.map((repo, index) => (
                    <li key={`${repo.owner}/${repo.name}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          applySuggestion({
                            id: `${repo.owner}/${repo.name}`,
                            label: `${repo.owner}/${repo.name}`,
                            insert: `#${repo.name}`,
                          })
                        }}
                        onMouseEnter={() => setTriggerIndex(index)}
                        className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm ${
                          index === triggerIndex ? "bg-muted" : ""
                        }`}
                      >
                        <BookMarked className="size-4 shrink-0 text-muted-foreground" />

                        <span className="min-w-0 flex-1 truncate">
                          {repo.owner}/{repo.name}
                        </span>

                        {repo.archived && (
                          <Badge variant="secondary">{t("repo.visibility.archived")}</Badge>
                        )}

                        {repo.language && (
                          <Badge variant="outline">{repo.language}</Badge>
                        )}
                      </button>
                    </li>
                  ))}
            </ul>
          )}

          <Field className="w-full">
            <InputGroup className="h-7">
              <InputGroupAddon>
                <Plus />
              </InputGroupAddon>

              <InputGroupInput
                ref={setDraftInput}
                placeholder={t("nav.todos.placeholder")}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  syncTrigger(e.target.value, e.target.selectionStart ?? 0)
                }}
                onKeyDown={handleDraftKeyDown}
              />

              <InputGroupAddon align="inline-end">
                <Kbd className="px-1">↵</Kbd>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </DialogContent>

      <Dialog
        open={reminderFor !== null}
        onOpenChange={(next) => {
          if (!next) setReminderFor(null)
        }}
      >
        <DialogContent className="gap-2 p-3 sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{t("todos.reminder.remindMe")}</DialogTitle>
          </DialogHeader>

          <Field>
            <Input
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReminderFor(null)}
            >
              {t("common.actions.cancel")}
            </Button>

            <Button size="sm" onClick={saveTimeReminder}>
              {t("todos.reminder.set")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={repoPickerFor !== null}
        onOpenChange={(next) => {
          if (!next) setRepoPickerFor(null)
        }}
      >
        <DialogContent className="gap-2 p-3 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("todos.reminder.repoPageTitle")}</DialogTitle>
          </DialogHeader>

          <Field>
            <InputGroup className="h-7">
              <InputGroupInput
                autoFocus
                placeholder={t("common.states.typeToSearch")}
                value={repoQuery}
                onChange={(e) => setRepoQuery(e.target.value)}
              />
            </InputGroup>
          </Field>

          <ul className="max-h-56 overflow-y-auto">
            {repoPickerList.length === 0 ? (
              <li className="px-1 py-2 text-sm text-muted-foreground">
                {t("nav.todos.noRepos")}
              </li>
            ) : (
              repoPickerList.map((repo) => (
                <li key={`${repo.owner}/${repo.name}`}>
                  <button
                    type="button"
                    onClick={() =>
                      saveRepoReminder({ owner: repo.owner, name: repo.name })
                    }
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <BookMarked className="size-4 shrink-0 text-muted-foreground" />

                    <span className="min-w-0 flex-1 truncate">
                      {repo.owner}/{repo.name}
                    </span>

                    {repo.language && (
                      <Badge variant="outline">{repo.language}</Badge>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
