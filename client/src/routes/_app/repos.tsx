import { createFileRoute } from "@tanstack/react-router";

import Repos from "#/components/home/repos";
import DashboardLayout from "#/components/layouts/dashboard-layout";
import useUserRepos from "#/hooks/useUserRepos";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/repos")({
	component: ReposPage,
	server: {
		middleware: [authMiddleware],
	},
});

function ReposPage() {
	const repos = useUserRepos();

	return (
		<DashboardLayout>
			<Repos repos={repos} />
		</DashboardLayout>
	);
}
