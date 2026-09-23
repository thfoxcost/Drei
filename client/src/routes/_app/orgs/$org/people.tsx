import { createFileRoute } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "#/components/ui/input-group";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { useOrganization, useOrganizationMembers } from "#/hooks/useOrganizations";

export const Route = createFileRoute("/_app/orgs/$org/people")({
  component: RouteComponent,
});

function formatJoinedDate(date: string) {
  const joined = new Date(date);
  const now = new Date();

  const seconds = Math.floor((now.getTime() - joined.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  return "just now";
}

function RouteComponent() {
  const { org } = Route.useParams();
  const { data, isLoading, isError } = useOrganization(org);
  const {
    data: members = [],
    isLoading: isMembersLoading,
    isError: isMembersError,
  } = useOrganizationMembers(org);
  const [query, setQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return members;
    }

    return members.filter((member) =>
      member.name.toLowerCase().includes(search),
    );
  }, [members, query]);

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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <UserRound className="size-5" />

          <h1 className="text-2xl font-semibold">People</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          People who are members of {data.name}.
        </p>
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupInput
            placeholder="Search people..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>

          <InputGroupAddon align="inline-end">
            {filteredMembers.length}{" "}
            {filteredMembers.length === 1 ? "person" : "people"}
          </InputGroupAddon>
        </InputGroup>

        {isMembersLoading ? (
          <div className="flex w-full items-center justify-center py-12">
            <Spinner />
          </div>
        ) : isMembersError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
            <UserRound className="size-7 text-muted-foreground" />

            <p className="text-sm font-medium">No people found</p>

            <p className="text-sm text-muted-foreground">
              Failed to load members
            </p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="divide-y rounded-md border">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <Avatar className="size-10 shrink-0">
                  {member.image && (
                    <AvatarImage src={member.image} alt={member.name} />
                  )}

                  <AvatarFallback>
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {member.name}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    joined: {formatJoinedDate(member.joinedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
            <UserRound className="size-7 text-muted-foreground" />

            <p className="text-sm font-medium">No people found</p>

            <p className="text-sm text-muted-foreground">
              {query
                ? `Nothing matches "${query}"`
                : "This organization has no members yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
