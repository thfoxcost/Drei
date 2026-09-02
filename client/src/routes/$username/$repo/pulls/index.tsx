import { createFileRoute } from "@tanstack/react-router";
import PullRequests from "@/components/repo/pulls/prs";

export const Route = createFileRoute("/$username/$repo/pulls/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { username, repo }  = Route.useParams();

	return <PullRequests owner={username} repo={repo} />;
}

