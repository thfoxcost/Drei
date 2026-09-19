import { Link } from "@tanstack/react-router"
import { GitMerge } from "lucide-react"
import { useMemo } from "react"
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { usePullRequests } from "#/hooks/PRs/use-pull-requests"

interface NewPrIndicatorProps {
	owner: string
	repo: string
	branches: string[]
	branchDates: Record<string, string>
	defaultBranch: string
}

function isNewBranch(dateStr: string): boolean {
	if (!dateStr) return false
	const pushed = new Date(dateStr).getTime()
	const now = Date.now()
	return now - pushed < 30 * 60 * 1000
}

function NewPrIndicator({ owner, repo, branches, branchDates, defaultBranch }: NewPrIndicatorProps) {
	const { data: prs } = usePullRequests(owner, repo, { state: "open" })

	const openSourceBranches = new Set(
		(prs?.pulls ?? []).map((pr) => pr.sourceBranch),
	)

	const freshBranches = useMemo(() => {
		return branches.filter(
			(b) => b !== defaultBranch && !openSourceBranches.has(b) && isNewBranch(branchDates[b] ?? ""),
		)
	}, [branches, defaultBranch, openSourceBranches, branchDates])

	if (freshBranches.length === 0) return null

	const target = freshBranches[0]

	return (
		<div className="pb-4">
			<Item variant="outline" className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30">
				<ItemContent>
					<ItemTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
						<GitMerge className="h-4 w-4" />
						{freshBranches.length} new branch{freshBranches.length > 1 ? "es" : ""} ready for a pull request
					</ItemTitle>
					<ItemDescription className="text-yellow-700 dark:text-yellow-400">
						{freshBranches.length === 1
							? `The ${target} branch was recently pushed and has no pull request yet.`
							: `Branches ${freshBranches.slice(0, 3).join(", ")}${freshBranches.length > 3 ? ` and ${freshBranches.length - 3} more` : ""} were recently pushed and have no pull request yet.`}
					</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Button asChild className="bg-green-600 hover:bg-green-700 text-white">
						<Link to={`/${owner}/${repo}/compare/${defaultBranch}...${target}`}>
							Create pull request
						</Link>
					</Button>
				</ItemActions>
			</Item>
		</div>
	)
}

export default NewPrIndicator
