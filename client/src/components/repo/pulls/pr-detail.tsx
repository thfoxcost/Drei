import { Badge as ReuiBadge } from "@/components/reui/badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { CircleCheck, Copy, GitPullRequest } from "lucide-react";

function PRdetail() {
	return (
		<div>
			<h1 className="flex min-w-0 items-baseline gap-1 truncate text-3xl font-medium tracking-tight">
				<span className="min-w-0 truncate">
					feat: implement pull requests feature with UI components
				</span>

				<span className="shrink-0 font-light text-muted-foreground">
					#97
				</span>

				<div className="ml-auto flex shrink-0 items-center gap-1">
					<Button variant="outline">
						<CircleCheck className="text-success" />
						Ready to merge
					</Button>

					<Button variant="outline">Edit</Button>
				</div>
			</h1>

			<div className="mt-2 flex items-center gap-2">
				<Badge
					variant="secondary"
					className="h-7 gap-1.5 bg-green-600 text-sm"
				>
					<GitPullRequest className="size-4 shrink-0" />
					<span className="font-bold">Open</span>
				</Badge>

				<span className="text-sm text-muted-foreground">
					<span className="font-semibold underline">thefoxcost</span>{" "}
					wants to merge 2 commits into{" "}
					<ReuiBadge variant="save-info">main</ReuiBadge>{" "}
					from{" "}
					<ReuiBadge variant="save-info">feat/pulls</ReuiBadge>
				</span>

				<Button
					variant="ghost"
					size="icon"
					className="text-muted-foreground"
				>
					<Copy />
				</Button>
			</div>
		</div>
	);
}

export default PRdetail;

