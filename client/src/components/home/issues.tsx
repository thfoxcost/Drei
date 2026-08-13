import { CircleDot } from "lucide-react";

function Issues() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-xl font-semibold">Issues</h1>
				<p className="text-sm text-muted-foreground">
					Issues across all of your repositories.
				</p>
			</div>

			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
				<CircleDot className="text-muted-foreground" size={28} />
				<p className="text-sm font-medium">No issues yet</p>
				<p className="text-sm text-muted-foreground">
					Global issues across your repositories will appear here.
				</p>
			</div>
		</div>
	);
}

export default Issues;
