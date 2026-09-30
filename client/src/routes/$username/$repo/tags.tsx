import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TagsList } from "#/components/repo/tags/tags-list";
import { useTags } from "#/hooks/useTags";

export const Route = createFileRoute("/$username/$repo/tags")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const { username, repo }: { username: string; repo: string } =
		Route.useParams();
	const { data, isLoading, isError } = useTags(username, repo);

	return (
		<div className="mx-32 mt-2 mb-20 flex h-full flex-col">
			<div className="mb-3 flex flex-row items-center justify-between">
				<h1 className="text-lg font-semibold">{t("repo.tags.title")}</h1>
				<span className="text-sm text-muted-foreground">
					{t("repo.tags.count", { count: data?.length ?? 0 })}
				</span>
			</div>
			<TagsList
				owner={username}
				repo={repo}
				tags={data ?? []}
				isLoading={isLoading}
				isError={isError}
			/>
		</div>
	);
}
