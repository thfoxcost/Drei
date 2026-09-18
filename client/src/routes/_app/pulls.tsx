import { createFileRoute } from "@tanstack/react-router";

import Pulls from "#/components/home/pulls";
import DashboardLayout from "#/components/layouts/dashboard-layout";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/pulls")({
	component: PullsPage,
	server: {
		middleware: [authMiddleware],
	},
});

function PullsPage() {
	return (
		<DashboardLayout>
			<Pulls />
		</DashboardLayout>
	);
}
