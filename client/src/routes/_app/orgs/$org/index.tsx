import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "#/components/ui/avatar";
import { useInitials } from "#/hooks/useInitials";
import { Button } from "#/components/ui/button";
import { GraduationCap, Mail, TriangleAlert, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";
import { useOrganization } from "#/hooks/useOrganizations";

export const Route = createFileRoute("/_app/orgs/$org/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { org } = Route.useParams();
  const { data, isLoading, isError } = useOrganization(org);
  const { data: session } = authClient.useSession();
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
  const isFollowing = true;
  const createdAt = new Date(data.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-5 my-5">
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
              className={`absolute right-[-8px] bottom-[-4px] size-5 rounded-full border-2 border-background ${data.status === "active"
                  ? "bg-green-600 dark:bg-green-500"
                  : "bg-gray-400 dark:bg-gray-500"
                }`}
            >
              <span className="sr-only">Away</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-5xl font-bold">{data.name}</h1>

              {data.verified && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <GraduationCap className="size-6" />
                      <span className="sr-only">Verified organization</span>
                    </button>
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>Verified organization</p>
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
            <span className="text-sm text-muted-foreground max-w-4xl">{data.description}</span>
            <div className="mt-auto flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1 rounded-full pl-0.5"
              >
                <Avatar className="size-6 border-2 border-background">
                  {data.createdBy.image && (
                    <AvatarImage src={data.createdBy.image} alt={`@${data.createdBy.name}`} />
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
                  <span className="text-foreground">{data.memberCount}</span> members
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
                  Created: <span className="text-foreground">{createdAt}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {isFollowing ?
          <Button variant="destructive" disabled={isUserAdmin}>
            <TriangleAlert />
            Following
          </Button>
          :
          <Button disabled={isUserAdmin}>
            Follow
          </Button>
        }


      </div>
      <Separator className="my-5" />
      <div className="">

      </div>
    </div>
  );
}
