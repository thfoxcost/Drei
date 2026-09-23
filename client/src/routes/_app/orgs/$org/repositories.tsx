import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2 } from "lucide-react";
import { RepoList } from "#/components/organization/repo-card";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { useOrganization } from "#/hooks/useOrganizations";

export const Route = createFileRoute("/_app/orgs/$org/repositories")({
  component: RouteComponent,
});

function RouteComponent() {
  const { org } = Route.useParams();
  const { data, isLoading, isError } = useOrganization(org);

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
        Organization not found
      </div>
    );
  }

  return (
    <div className="mx-40 my-5">
      <div className="flex flex-col gap-1 my-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Repositories</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Repositories owned by {data.name}.
        </p>
      </div>

      <RepoList />
    </div>
  );
}
