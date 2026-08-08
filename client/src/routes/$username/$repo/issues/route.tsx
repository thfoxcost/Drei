import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/issues")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="overflow-hidden">
			<Outlet />
		</div>
	);
}
