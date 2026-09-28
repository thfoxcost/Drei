import { createFileRoute } from "@tanstack/react-router";

import DashboardLayout from "#/components/layouts/dashboard-layout";
import { PeopleTable } from "#/components/people/people-table";
import { Separator } from "#/components/ui/separator";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/people")({
	component: PeoplePage,
	server: {
		middleware: [authMiddleware],
	},
});

function PeoplePage() {
	return (
		<DashboardLayout wide>
			<div className="my-1">
				<h1 className="text-2xl">People</h1>
				<Separator className="my-2 mb-4" />
				<PeopleTable />
			</div>
		</DashboardLayout>
	);
}
