import { useCallback, useRef, useState } from "react"

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
				setError(`Unsupported file type. Please use ${acceptedTypes.join(", ")}.`)
				if (inputRef.current) inputRef.current.value = ""
				return
			}

			if (file.size > maxSize) {
				setError(`File is too large. Please choose a file under ${Math.round(maxSize / (1024 * 1024))} MB.`)
				if (inputRef.current) inputRef.current.value = ""
				return
			}

			setError(null)
			setUploading(true)

			onFile(file)
				.catch((err: unknown) => {
					setError(err instanceof Error ? err.message : "Upload failed")
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
