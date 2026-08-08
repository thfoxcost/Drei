import { createFileRoute } from "@tanstack/react-router";
import Issues from "#/components/repo/issues/issue";

export const Route = createFileRoute("/$username/$repo/issues/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Issues />;
}
