import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Users } from "lucide-react";
import { toast } from "sonner";
import { getPurposeMeta } from "#/components/organization/purpose";
import { RepoList } from "#/components/organization/repo-card";
import { Frame, FramePanel } from "#/components/reui/frame";
import { getLanguageColor } from "#/lib/language-color";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { useInitials } from "#/hooks/useInitials";
import {
  useJoinOrganization,
  useLeaveOrganization,
  useOrganization,
  useOrganizationLanguages,
  useOrganizationMembers,
  useOrganizationRepositories,
} from "#/hooks/useOrganizations";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app/orgs/$org/")({
  component: RouteComponent,
});


function RouteComponent() {
  const { org } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useOrganization(org);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { data: members = [], isLoading: isMembersLoading } =
    useOrganizationMembers(org);
  const {
    data: repoData,
    isLoading: isReposLoading,
    isError: isReposError,
  } = useOrganizationRepositories(org);
  const { data: languages = [] } = useOrganizationLanguages(org);
  const joinOrganization = useJoinOrganization(org);
  const leaveOrganization = useLeaveOrganization(org);
  const orgInitials = useInitials(data?.name ?? org);

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

  const avatarUrl = data.avatar
    ? `${import.meta.env.VITE_BACKEND_URL}/uploads/${data.avatar}`
    : null;

  const isUserAdmin = session?.user.id === data.createdBy.id;

  const isMember = members.some((member) => member.id === session?.user.id);
  const isMembershipLoading = isSessionPending || isMembersLoading;
  const isMembershipMutating =
    joinOrganization.isPending || leaveOrganization.isPending;

  const createdAt = new Date(data.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const purposeMeta = getPurposeMeta(data.purpose);
  const PurposeIcon = purposeMeta?.icon;

  return (
    <div className="mx-15 my-5">
      <div className="flex justify-between">
        <div className="flex gap-5">
          <div className="relative size-40">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={data.name}
                className="size-40 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-40 items-center justify-center rounded-xl bg-muted text-3xl font-medium">
                {orgInitials}
              </div>
            )}

            <span
              className={`absolute right-[-12px] bottom-[-7px] size-7 rounded-full border-4 border-background ${data.status === "active"
                ? "bg-green-600 dark:bg-green-500"
                : "bg-gray-400 dark:bg-gray-500"
                }`}
            >
              <span className="sr-only">
                {data.status === "active" ? "Active" : "Suspended"}
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <h1 className="text-5xl font-bold">{data.name}</h1>

              {PurposeIcon && purposeMeta && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <PurposeIcon className="mt-3 size-6" />
                    </button>
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>{purposeMeta.label}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <span className="max-w-6xl text-sm text-muted-foreground">
              {data.description}
            </span>

            <div className="mt-auto flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1 rounded-full pl-0.5"
              >
                <Avatar className="size-6 border-2 border-background">
                  {data.createdBy.image && (
                    <AvatarImage
                      src={data.createdBy.image}
                      alt={`@${data.createdBy.name}`}
                    />
                  )}

                  <AvatarFallback>
                    {data.createdBy.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>

                <span className="text-xs">@{data.createdBy.name}</span>
              </Button>

              <div className="h-5 w-px bg-border" />

              <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4" />

                <span>
                  <span className="text-foreground">{data.memberCount}</span>{" "}
                  members
                </span>

                {data.email && (
                  <>
                    <span className="mx-1 text-muted-foreground/60">•</span>

                    <Mail className="size-4" />

                    <span className="font-semibold text-foreground">
                      {data.email}
                    </span>
                  </>
                )}

                <span className="mx-1 text-muted-foreground/60">•</span>

                <span>
                  Created:{" "}
                  <span className="text-foreground">{createdAt}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          {!isUserAdmin && !isMembershipLoading && (
            isMember ? (
              <Button
                variant="outline"
                disabled={isMembershipMutating}
                onClick={() => {
                  leaveOrganization.mutate(undefined, {
                    onSuccess: () => toast.success("Left organization"),
                    onError: (err) =>
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Failed to leave organization",
                      ),
                  });
                }}
              >
                {leaveOrganization.isPending ? "Leaving..." : "Leave organization"}
              </Button>
            ) : (
              <Button
                disabled={isMembershipMutating}
                onClick={() => {
                  joinOrganization.mutate(undefined, {
                    onSuccess: () => toast.success("Joined organization"),
                    onError: (err) =>
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Failed to join organization",
                      ),
                  });
                }}
              >
                {joinOrganization.isPending ? "Joining..." : "Join organization"}
              </Button>
            )
          )}

          {isUserAdmin ? (
            <Button
              onClick={() => navigate({ to: "/new", search: { org } })}
            >
              New Repository
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>New Repository</Button>
                </span>
              </TooltipTrigger>

              <TooltipContent align="end">
                <p>Only organization admins can create repositories</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <Separator className="my-5" />

      <div className="flex gap-5">
        <RepoList
          owner={org}
          repos={repoData?.repositories ?? []}
          isLoading={isReposLoading}
          isError={isReposError}
        />
        <div className="h-auto border border-dashed" />
        <div className="min-w-sm">
          <div className="flex flex-col gap-2">
            {/* Members */}
            <div className="flex flex-col gap-2">
              <Link
                to="/orgs/$org/people"
                params={{ org }}
                className="font-medium hover:underline"
              >
                Members
              </Link>

              <Frame>
                <FramePanel className="flex max-w-[375px] flex-wrap items-center gap-2 p-2!">
                  {members.slice(0, 8).map((member) => (
                    <Avatar key={member.id} className="size-8 shrink-0">
                      {member.image && (
                        <AvatarImage src={member.image} alt={member.name} />
                      )}
                      <AvatarFallback>
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </FramePanel>
              </Frame>
            </div>

            <Separator className="my-3" />

            {languages.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-medium">Top languages</span>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  {languages.map((language) => (
                    <div
                      key={language.name}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="size-3 rounded-full"
                        style={{
                          backgroundColor: getLanguageColor(language.name),
                        }}
                      />
                      <span>{language.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
