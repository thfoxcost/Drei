import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/orgs/$org/repositories")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_app/orgs/$org/repositories"!</div>;
}
