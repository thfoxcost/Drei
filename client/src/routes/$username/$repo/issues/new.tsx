import { createFileRoute } from "@tanstack/react-router";
import NewIssue from "#/components/repo/issues/new-issue";

export const Route = createFileRoute("/$username/$repo/issues/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <NewIssue />;
}
