import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { ImageUp } from "lucide-react"

import { cn } from "#/lib/utils.ts"
import { Spinner } from "#/components/ui/spinner.tsx"

export interface FileUploadCompactProps {
	accept?: string
	hint?: string
	uploading?: boolean
	disabled?: boolean
	error?: string | null
	className?: string
	onSelect: (file: File) => void
}

function FileUploadCompact({
	accept = "image/png,image/jpeg,image/webp,image/gif",
	hint,
	uploading = false,
	disabled = false,
	error,
	className,
	onSelect,
}: FileUploadCompactProps) {
	const { t } = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className={cn("space-y-2", className)}>
			<label
				className={cn(
					"group flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-3 py-2 transition-colors",
					"hover:border-primary hover:bg-muted/50",
					"data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
				)}
				data-disabled={disabled || uploading}
			>
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					className="sr-only"
					disabled={disabled || uploading}
					onChange={(e) => {
						const file = e.target.files?.[0]
						if (file) onSelect(file)
						e.target.value = ""
					}}
				/>

				{uploading ? (
					<Spinner className="size-4 text-muted-foreground" />
				) : (
					<ImageUp className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
				)}

				<span className="text-sm text-muted-foreground group-hover:text-primary">
					{uploading ? t("common.actions.uploading") : t("common.actions.uploadLogo")}
				</span>
			</label>

			{hint && (
				<p className="text-xs text-muted-foreground">{hint}</p>
			)}

			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	)
}

export { FileUploadCompact }
