import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RepoList } from "#/components/organization/repo-card";
import { Spinner } from "#/components/ui/spinner";
import {
	useOrganization,
	useOrganizationRepositories,
} from "#/hooks/useOrganizations";

export const Route = createFileRoute("/_app/orgs/$org/repositories")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const { org } = Route.useParams();
	const { data, isLoading, isError } = useOrganization(org);
	const {
		data: repoData,
		isLoading: isReposLoading,
		isError: isReposError,
	} = useOrganizationRepositories(org);

	if (isLoading) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground">
				{t("orgs.notFound")}
			</div>
		);
	}

	return (
		<div className="mx-40 my-5">
			<div className="flex flex-col gap-1 my-2">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold">
						{t("orgs.repositories.heading")}
					</h1>
				</div>

				<p className="text-sm text-muted-foreground">
					{t("orgs.repositories.subtitle", { name: data.name })}
				</p>
			</div>

			<RepoList
				owner={org}
				repos={repoData?.repositories ?? []}
				isLoading={isReposLoading}
				isError={isReposError}
			/>
		</div>
	);
}
