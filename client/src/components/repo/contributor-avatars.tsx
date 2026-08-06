"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "../ui/avatar";

const MAX_VISIBLE = 4;

export interface Contributor {
  id: string;
  username: string;
  avatar: string | null;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function renderAvatar(contributor: Contributor, className?: string) {
  return (
    <Avatar key={contributor.username} title={contributor.username} className={className}>
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
  if (contributors.length === 0) {
    return null;
  }

  if (contributors.length < MAX_VISIBLE) {
    return (
      <ul className="space-y-2">
        {contributors.map((contributor) => (
          <li key={contributor.username} className="flex items-center gap-2">
            {renderAvatar(contributor, "h-7 w-7")}
            <span className="text-sm text-muted-foreground">
              {contributor.username}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const remaining = contributors.length - MAX_VISIBLE;

  return (
    <AvatarGroup>
      {contributors.slice(0, MAX_VISIBLE).map((contributor) =>
        renderAvatar(contributor)
      )}
      {remaining > 0 && (
        <AvatarGroupCount>+{remaining}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
