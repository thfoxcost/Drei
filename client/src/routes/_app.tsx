import { createFileRoute, Outlet } from "@tanstack/react-router";
import Header from "#/components/header";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	return (
		<div className="flex h-dvh flex-col overflow-hidden">
			<Header />
			<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}
