import { GitPullRequest } from "lucide-react";

function Pulls() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-xl font-semibold">Pull Requests</h1>
				<p className="text-sm text-muted-foreground">
					Pull requests across all of your repositories.
				</p>
			</div>

			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
				<GitPullRequest className="text-muted-foreground" size={28} />
				<p className="text-sm font-medium">No pull requests yet</p>
				<p className="text-sm text-muted-foreground">
					Global pull requests across your repositories will appear here.
				</p>
			</div>
		</div>
	);
}

export default Pulls;
