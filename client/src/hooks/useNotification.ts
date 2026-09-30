import { useCallback } from "react"
import { toast } from "sonner"
import { apiErrorMessage } from "#/i18n/lib/api-error"

const API_BASE = "http://localhost:3200"

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
				const res = await fetch(`${API_BASE}/api/notifications/send`, {
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
					throw new Error(apiErrorMessage(result))
				}

				const result = await res.json()
				return result.sent > 0
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: apiErrorMessage(null, { fallbackKey: "errors.client.sendNotification" }),
				)
				return false
			}
		},
		[],
	)

	const testNotification = useCallback(
		async (payload: TestNotificationPayload): Promise<boolean> => {
			try {
				const res = await fetch(`${API_BASE}/api/notifications/test`, {
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
					throw new Error(apiErrorMessage(result))
				}

				return true
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: apiErrorMessage(null, { fallbackKey: "errors.client.testNotificationShort" }),
				)
				return false
			}
		},
		[],
	)

	return { sendNotification, testNotification }
}
