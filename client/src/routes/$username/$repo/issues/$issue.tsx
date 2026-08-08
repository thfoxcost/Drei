import { createFileRoute } from "@tanstack/react-router";
import IssueDetail from "#/components/repo/issues/issue-detail";

export const Route = createFileRoute("/$username/$repo/issues/$issue")({
	component: RouteComponent,
});

function RouteComponent() {
	return <IssueDetail />;
}
