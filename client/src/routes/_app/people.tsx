import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "#/components/layouts/dashboard-layout";
import { PeopleTable } from "#/components/people/people-table";
import { ReposTable } from "#/components/people/repos-table";
import { Separator } from "#/components/ui/separator";
import { type PeopleView, ViewToggle } from "#/components/view-toggle";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/people")({
	component: PeoplePage,
	server: {
		middleware: [authMiddleware],
	},
});

function PeoplePage() {
	const { t } = useTranslation();
	const [view, setView] = useState<PeopleView>("users");

	return (
		<DashboardLayout wide>
			<div className="my-1">
				<div className="flex items-center justify-between gap-2">
					<h1 className="text-2xl">
						{view === "users"
							? t("people.heading")
							: t("people.repositoriesHeading")}
					</h1>
					<ViewToggle value={view} onValueChange={setView} />
				</div>
				<Separator className="my-2 mb-4" />
				{view === "users" ? <PeopleTable /> : <ReposTable />}
			</div>
		</DashboardLayout>
	);
}
