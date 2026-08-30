import Commit from "#/components/repo/commits/commit";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/commits/$hash")({
	component: RouteComponent,
});

function RouteComponent() {
	const { hash, username, repo } = Route.useParams();

	return (
		<div className="w-full">
			<Commit hash={hash} owner={username} repo={repo} />
		</div>
	);
}