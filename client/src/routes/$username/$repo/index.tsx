import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

import { NoRepo } from "#/components/repo/norepo";
import Repo from "#/components/repo/repo";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useRepoData } from "#/hooks/useRepoData";

export const Route = createFileRoute("/$username/$repo/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { username, repo }: { username: string; repo: string } =
		Route.useParams();
	const { data, isLoading, isError, isFetching, refetch, error } =
		useRepoData(username, repo);

	if (isLoading) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// A backend/API failure is visibly different from an actually empty
	// repository — it never renders the NoRepo empty state.
	if (isError) {
		return (
			<div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 text-center">
				<TriangleAlert className="size-7 text-destructive" />

				<p className="text-sm font-medium">Failed to load repository</p>

				<p className="text-sm text-muted-foreground">
					{error instanceof Error && error.message
						? error.message
						: "Something went wrong while fetching this repository."}
				</p>

				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isFetching}
				>
					{isFetching ? "Retrying..." : "Try again"}
				</Button>
			</div>
		);
	}

	if (data?.hasCommits) {
		return <Repo owner={username} repo={repo} />;
	}

	return <NoRepo />;
}
