import { useEffect, useState } from "react"
import { Check, ChevronDown, Copy } from "lucide-react"
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard"

export type DiffLine = {
	type: "added" | "removed" | "unchanged"
	oldLine?: number | null
	newLine?: number | null
	content: string
}

export type DiffHunk = {
	header: string
	lines: DiffLine[]
}

export type FileDiff = {
	path: string
	action: string
	additions: number
	deletions: number
	hunks: DiffHunk[]
}

function highlightText(content: string, search: string) {
	if (!search.trim()) {
		return content
	}

	const escapedSearch = search.replace(
		/[.*+?^${}()|[\]\\]/g,
		"\\$&",
	)

	const regex = new RegExp(`(${escapedSearch})`, "gi")

	return content.split(regex).map((part, index) => {
		const isMatch =
			part.toLowerCase() === search.toLowerCase()

		return isMatch ? (
			<mark
				key={index}
				className="rounded-sm bg-yellow-300/60 px-0.5 text-inherit dark:bg-yellow-500/40"
			>
				{part}
			</mark>
		) : (
			part
		)
	})
}

type CodeCommitBlockProps = {
	diff: FileDiff
	search?: string
	expanded?: boolean
	expandGeneration?: number
	diffId?: string
	viewed?: boolean
}

function CodeCommitBlock({
	diff,
	search = "",
	expanded = true,
	expandGeneration = 0,
	diffId,
	viewed = false,
}: CodeCommitBlockProps) {
	const { isCopied, copyToClipboard } =
		useCopyToClipboard()

	const [isExpanded, setIsExpanded] = useState(true)
	const [syncedGeneration, setSyncedGeneration] = useState(0)

	useEffect(() => {
		if (expandGeneration !== syncedGeneration) {
			setIsExpanded(expanded)
			setSyncedGeneration(expandGeneration)
		}
	}, [expandGeneration, expanded, syncedGeneration])

	useEffect(() => {
		if (viewed) {
			setIsExpanded(false)
		}
	}, [viewed])

	const filePath = diff.path

	const additions = diff.additions
	const deletions = diff.deletions

	const maxSquares = 5

	const greenSquares = Math.min(
		additions,
		maxSquares,
	)

	const redSquares = Math.min(
		deletions,
		maxSquares - greenSquares,
	)

	const emptySquares =
		maxSquares - greenSquares - redSquares

	return (
		<div id={diffId} className={`mt-3 w-full overflow-hidden rounded-md border scroll-mt-4 transition-all duration-500 ${viewed ? "opacity-50" : ""}`}>
			<div className={`flex h-10 items-center gap-2 bg-muted/30 px-2 ${isExpanded ? "border-b" : ""}`}>
				<button
					type="button"
					onClick={() =>
						setIsExpanded((value) => !value)
					}
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={
						isExpanded
							? "Collapse code"
							: "Expand code"
					}
				>
					<ChevronDown
						size={16}
						className={`transition-transform duration-200 ${
							isExpanded
								? "rotate-0"
								: "-rotate-90"
						}`}
					/>
				</button>

				<span className="cursor-pointer truncate font-mono text-xs transition-colors hover:text-blue-500 hover:underline">
					{filePath}
				</span>

				{viewed && (
					<span className="shrink-0 rounded-full border border-secondary-foreground/20 bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
						Viewed
					</span>
				)}

				<div className="ml-auto flex shrink-0 items-center gap-3">
					<div className="flex items-center gap-1.5 font-mono text-[11px]">
						{additions > 0 && (
							<span className="text-green-600 dark:text-green-500">
								+{additions}
							</span>
						)}

						{deletions > 0 && (
							<span className="text-red-600 dark:text-red-500">
								-{deletions}
							</span>
						)}

						<div className="flex items-center gap-0.5">
							{Array.from({
								length: greenSquares,
							}).map((_, index) => (
								<span
									key={`green-${index}`}
									className="h-2 w-2  bg-green-500"
								/>
							))}

							{Array.from({
								length: redSquares,
							}).map((_, index) => (
								<span
									key={`red-${index}`}
									className="h-2 w-2 bg-red-500"
								/>
							))}

							{Array.from({
								length: emptySquares,
							}).map((_, index) => (
								<span
									key={`empty-${index}`}
									className="h-2 w-2 bg-muted"
								/>
							))}
						</div>
					</div>

					<button
						type="button"
						onClick={() =>
							copyToClipboard(filePath)
						}
						className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={
							isCopied
								? "Copied"
								: "Copy file path"
						}
					>
						{isCopied ? (
							<Check size={15} />
						) : (
							<Copy size={15} />
						)}
					</button>
				</div>
			</div>

			{isExpanded && (
				<div className="overflow-x-auto">
					<div className="min-w-max font-mono text-xs">
						{diff.hunks.map((hunk, hunkIndex) => (
							<div key={hunkIndex}>
								<div className="flex min-h-7 items-center bg-muted/30 px-2 text-muted-foreground">
									<span className="whitespace-pre">
										{hunk.header}
									</span>
								</div>

								{hunk.lines.map((line, lineIndex) => {
									const isAdded =
										line.type === "added"

									const isRemoved =
										line.type === "removed"

									const isChanged =
										isAdded || isRemoved

									return (
										<div
											key={lineIndex}
											className={`flex min-h-6 ${
												isAdded
													? "bg-green-500/10"
													: isRemoved
														? "bg-red-500/10"
														: ""
											}`}
										>
											<span
												className={`min-w-8 shrink-0 select-none px-1 text-center ${
													isChanged
														? isAdded
															? "bg-green-500/30 text-green-700 dark:bg-green-500/30 dark:text-green-400"
															: "bg-red-500/30 text-red-700 dark:bg-red-500/30 dark:text-red-400"
														: "text-muted-foreground"
												}`}
											>
												{line.oldLine ?? ""}
											</span>

											<span
												className={`min-w-8 shrink-0 select-none px-1 text-center ${
													isChanged
														? isAdded
															? "bg-green-500/30 text-green-700 dark:bg-green-500/30 dark:text-green-400"
															: "bg-red-500/30 text-red-700 dark:bg-red-500/30 dark:text-red-400"
														: "text-muted-foreground"
												}`}
											>
												{line.newLine ?? ""}
											</span>

											<span
												className={`w-6 shrink-0 select-none text-center font-semibold ${
													isAdded
														? "text-green-600 dark:text-green-500"
														: isRemoved
															? "text-red-600 dark:text-red-500"
															: "text-muted-foreground"
												}`}
											>
												{isAdded
													? "+"
													: isRemoved
														? "-"
														: ""}
											</span>

											<code
												className={`whitespace-pre px-2 ${
													isAdded
														? "text-green-700 dark:text-green-400"
														: isRemoved
															? "text-red-700 dark:text-red-400"
															: ""
												}`}
											>
												{highlightText(
													line.content,
													search,
												)}
											</code>
										</div>
									)
								})}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default CodeCommitBlock
