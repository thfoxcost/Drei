import { createFileRoute } from "@tanstack/react-router";

import Issues from "#/components/home/issues";
import DashboardLayout from "#/components/layouts/dashboard-layout";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/issues")({
	component: IssuesPage,
	server: {
		middleware: [authMiddleware],
	},
});

function IssuesPage() {
	return (
		<DashboardLayout>
			<Issues />
		</DashboardLayout>
	);
}
