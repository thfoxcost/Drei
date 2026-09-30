import { useCallback, useRef, useState } from "react"
import { i18n } from "#/i18n/i18n"
import { apiErrorMessage } from "#/i18n/lib/api-error"

export interface UseFileUploadOptions {
	acceptedTypes?: string[]
	maxSize?: number
	onFile: (file: File) => Promise<void>
}

export interface UseFileUploadResult {
	inputRef: React.RefObject<HTMLInputElement | null>
	uploading: boolean
	error: string | null
	openPicker: () => void
	handleSelect: (file?: File) => void
	clearError: () => void
}

export function useFileUpload({
	acceptedTypes,
	maxSize = 2 * 1024 * 1024,
	onFile,
}: UseFileUploadOptions): UseFileUploadResult {
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearError = useCallback(() => setError(null), [])

	const handleSelect = useCallback(
		(file?: File) => {
			if (!file) return

			if (acceptedTypes && !acceptedTypes.includes(file.type)) {
				setError(
					i18n.t("errors.client.fileUploadUnsupportedType", {
						types: acceptedTypes.join(", "),
					}) as string,
				)
				if (inputRef.current) inputRef.current.value = ""
				return
			}

			if (file.size > maxSize) {
				setError(
					i18n.t("errors.client.fileUploadTooLarge", {
						size: Math.round(maxSize / (1024 * 1024)),
					}) as string,
				)
				if (inputRef.current) inputRef.current.value = ""
				return
			}

			setError(null)
			setUploading(true)

			onFile(file)
				.catch((err: unknown) => {
					setError(err instanceof Error ? err.message : apiErrorMessage(null, { fallbackKey: "errors.client.uploadFailed" }))
				})
				.finally(() => {
					setUploading(false)
					if (inputRef.current) inputRef.current.value = ""
				})
		},
		[acceptedTypes, maxSize, onFile],
	)

	const openPicker = useCallback(() => {
		inputRef.current?.click()
	}, [])

	return { inputRef, uploading, error, openPicker, handleSelect, clearError }
}
