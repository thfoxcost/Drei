import { useCallback } from "react"
import { toast } from "sonner"

interface NotificationPayload {
	repositoryId?: number | null
	event: string
	title: string
	description: string
}

interface TestNotificationPayload {
	webhookId: number
	title: string
	description: string
}

interface UseNotificationResult {
	sendNotification: (payload: NotificationPayload) => Promise<boolean>
	testNotification: (payload: TestNotificationPayload) => Promise<boolean>
}

export function useNotification(): UseNotificationResult {
	const sendNotification = useCallback(
		async (payload: NotificationPayload): Promise<boolean> => {
			try {
				const res = await fetch("/api/notifications/send", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						repository_id: payload.repositoryId ?? null,
						title: payload.title,
						description: payload.description,
					}),
				})

				if (!res.ok) {
					const result = await res.json()
					throw new Error(result.error || "Failed to send notification")
				}

				const result = await res.json()
				return result.sent > 0
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Failed to send notification",
				)
				return false
			}
		},
		[],
	)

	const testNotification = useCallback(
		async (payload: TestNotificationPayload): Promise<boolean> => {
			try {
				const res = await fetch("/api/notifications/test", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						webhook_id: payload.webhookId,
						title: payload.title,
						description: payload.description,
					}),
				})

				if (!res.ok) {
					const result = await res.json()
					throw new Error(result.error || "Test failed")
				}

				return true
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Test notification failed",
				)
				return false
			}
		},
		[],
	)

	return { sendNotification, testNotification }
}
