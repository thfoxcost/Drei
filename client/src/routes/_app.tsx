import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import Header from "#/components/header";
import { LocaleSync } from "#/components/locale-sync";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	const matches = useMatches();
	const isOrgSection = matches.some(
		(match) => match.routeId === "/_app/orgs/$org",
	);

	return (
		<div className="flex h-dvh flex-col overflow-hidden">
			{/*
				Keeps the active language in step with the account-wide
				`appearance_language` preference, so a setting changed on another
				device wins without a reload.
			*/}
			<LocaleSync />

			{!isOrgSection && <Header />}
			<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}
