import { useEffect, useState } from "react"
import { Bell, Check, ChevronDown, Plus, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "#/components/ui/input-group"
import { Separator } from "#/components/ui/separator"
import { Spinner } from "#/components/ui/spinner"
import { useNotification } from "#/hooks/useNotification"

const API_BASE = "http://localhost:3200"

function DiscordIcon({ className = "size-4" }: { className?: string }) {
    return (
        <svg
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="currentColor"
        >
            <title>Discord</title>
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
        </svg>
    )
}

type Notification = {
    id: number
    user_id: string
    repository_id: number | null
    type: string
    encoded_url: string
    enabled: boolean
    created_at: string
    updated_at: string
}

function ContentNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [testing, setTesting] = useState<number | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [newUrl, setNewUrl] = useState("")
    const { testNotification: sendTestNotification } = useNotification()

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        try {
            const res = await fetch(`${API_BASE}/api/notifications`, {
                credentials: "include",
            })

            if (!res.ok) throw new Error("Failed to fetch notifications")

            const data = await res.json()
            setNotifications(data)
        } catch {
            toast.error("Failed to load notifications")
        } finally {
            setLoading(false)
        }
    }

    async function addDiscordNotification() {
        const url = newUrl.trim()
        if (!url) {
            toast.error("Enter a URL first")
            return
        }

        const bare = url.replace(/^https?:\/\//, "")
        const encoded = btoa(bare)

        try {
            const res = await fetch(`${API_BASE}/api/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    type: "discord",
                    encoded_url: encoded,
                }),
            })

            if (!res.ok) throw new Error("Failed to create notification")

            const created = await res.json()
            setNotifications((current) => [created, ...current])
            setNewUrl("")
            setIsAdding(false)
            toast.success("Notification created")
        } catch {
            toast.error("Failed to create notification")
        }
    }

    async function removeNotification(id: number) {
        try {
            const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) throw new Error("Failed to delete notification")

            setNotifications((current) =>
                current.filter((n) => n.id !== id),
            )
            toast.success("Notification removed")
        } catch {
            toast.error("Failed to delete notification")
        }
    }

    async function testNotification(notification: Notification) {
        setTesting(notification.id)

        try {
            const success = await sendTestNotification({
                webhookId: notification.id,
                title: "Drei notification test",
                description: "This is a test notification from Drei.",
            })

            if (success) {
                toast.success("Test notification sent")
            }
        } finally {
            setTesting(null)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto mb-10 w-full max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl">Notifications</h1>
                    <Separator className="my-4" />
                </div>
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                    <Spinner />
                    <span>Loading notifications...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto mb-10 w-full max-w-5xl space-y-6">
            {/* Warning Banner */}
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 size-4 text-yellow-600" />
                    <div>
                        <h3 className="text-sm font-medium text-yellow-600">
                            Notifications are not currently used
                        </h3>
                        <p className="mt-1 text-sm text-yellow-600/80">
                            This notification integration is configured but is
                            not currently connected to any application events.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure notifications to receive repository events.
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="size-4" />
                                New notification
                                <ChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setNewUrl("")
                                    setIsAdding(true)
                                }}
                            >
                                <DiscordIcon />
                                Discord
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Separator className="my-4" />
            </div>

            {/* New webhook URL input (shown when adding) */}
            {isAdding && (
                <div className="rounded-lg border p-4">
                    <label className="text-sm font-medium">
                        Discord Notification URL
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                        Paste your Discord notification webhook URL.
                    </p>
                    <InputGroup className="[--radius:9999px]">
                        <InputGroupAddon className="pl-3 text-muted-foreground">
                            https://
                        </InputGroupAddon>
                        <InputGroupInput
                            value={newUrl.replace(/^https?:\/\//, "")}
                            onChange={(event) => {
                                const value = event.target.value
                                setNewUrl(
                                    value ? `https://${value}` : "",
                                )
                            }}
                            placeholder="discord.com/api/webhooks/..."
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsAdding(false)
                                    setNewUrl("")
                                }}
                            >
                                Cancel
                            </InputGroupButton>
                            <InputGroupButton
                                variant="ghost"
                                size="sm"
                                onClick={addDiscordNotification}
                            >
                                Save
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
            )}

            {/* Empty state */}
            {notifications.length === 0 && !isAdding && (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed">
                    <Send className="mb-3 size-8 text-muted-foreground" />
                    <h3 className="font-medium">
                        No notifications configured
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a Discord notification to start receiving events.
                    </p>
                </div>
            )}

            {/* Notification Items */}
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="flex items-center gap-4 rounded-lg border px-4 py-3"
                >
                    {/* Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <DiscordIcon className="size-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium">Discord</h3>
                        <p className="text-sm text-muted-foreground truncate">
                            Send repository activity notifications to Discord.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={testing === notification.id}
                            onClick={() => testNotification(notification)}
                        >
                            {testing === notification.id ? (
                                <>
                                    <Spinner className="size-3" />
                                    <span className="ml-1">Testing...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="size-3.5" />
                                    Test
                                </>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNotification(notification.id)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ContentNotifications
