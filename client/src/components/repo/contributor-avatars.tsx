"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "../ui/avatar";

const MAX_VISIBLE = 3;

export interface Contributor {
  id: string;
  username: string;
  avatar: string | null;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function contributorKey(contributor: Contributor): string {
  return (contributor.id || contributor.username).toLowerCase();
}

function dedupeContributors(
  contributors: Contributor[]
): Contributor[] {
  const seen = new Set<string>();

  return contributors.filter((contributor) => {
    const key = contributorKey(contributor);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function renderAvatar(contributor: Contributor, className?: string) {
  return (
    <Avatar key={contributorKey(contributor)} title={contributor.username} className={className}>
      {contributor.avatar ? (
        <AvatarImage src={contributor.avatar} alt={contributor.username} />
      ) : null}
      <AvatarFallback className="text-xs">
        {getInitials(contributor.username)}
      </AvatarFallback>
    </Avatar>
  );
}

interface ContributorAvatarsProps {
  contributors: Contributor[];
}

export function ContributorAvatars({
  contributors,
}: ContributorAvatarsProps) {
  const uniqueContributors = dedupeContributors(contributors);

  if (uniqueContributors.length === 0) {
    return null;
  }

  if (uniqueContributors.length < MAX_VISIBLE) {
    return (
      <ul className="space-y-2">
        {uniqueContributors.map((contributor) => (
          <li key={contributorKey(contributor)} className="flex items-center gap-2">
            {renderAvatar(contributor, "h-7 w-7")}
            <span className="text-sm text-muted-foreground">
              {contributor.username}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const remaining = uniqueContributors.length - MAX_VISIBLE;

  return (
    <AvatarGroup>
      {uniqueContributors.slice(0, MAX_VISIBLE).map((contributor) =>
        renderAvatar(contributor)
      )}
      {remaining > 0 && (
        <AvatarGroupCount>+{remaining}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
