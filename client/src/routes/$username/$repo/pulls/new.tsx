import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/pulls/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>hello there from new</div>
	);
}
