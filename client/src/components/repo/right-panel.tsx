import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  GitCommitHorizontal,
  HardDrive,
  Tag,
  Scale,
  Link as LinkIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import * as linguistLanguages from "linguist-languages";

// Stable color for languages that don't have one defined by Linguist
function fallbackColor(name: string) {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

function getLanguageColor(name: string): string {
  const entry = (linguistLanguages as Record<string, { color?: string }>)[name];
  return entry?.color ?? fallbackColor(name);
}

// Dummy data
const DATA = {
  description:
    "A lightweight UI component library built on top of React and the DOM.",
  website: "https://thefoxcost.vercel.app/",
  license: "MIT",
  stars: 1284,
  watchers: 42,
  forks: 213,
  tags: ["React", "JavaScript", "UI", "Components", "DOM"],
  lastCommit: "July 21, 2026",
  languages: [
    { name: "TypeScript", percent: 52.4 },
    { name: "JavaScript", percent: 21.8 },
    { name: "CSS", percent: 14.1 },
    { name: "HTML", percent: 8.2 },
    { name: "Shell", percent: 3.5 },
    { name: "Go", percent: 3.1 },
    { name: "Rust", percent: 2.9 },
  ],
  contributors: [
    {
      name: "thefoxcost",
      image: "http://localhost:3000/lofichr.png",
    },
    {
      name: "Github",
      image: "https://avatars.githubusercontent.com/u/583231?v=4",
    },
    {
      name: "Linus Torvalds",
      image: "https://avatars.githubusercontent.com/u/1024025?v=4",
    },
    {
      name: "Shadcn",
      image: "https://github.com/shadcn.png",
    },
  ],
};

interface RightPanelProps {
  nCommits: number;
  nBranches: number;
  nTags: number;
  size: number;
}


export default function RightPanel({
  nCommits,
  nBranches,
  nTags,
  size,
}: RightPanelProps) {
  return (
    <div className="w-full max-w-xs space-y-5">
      {/* About */}
      <div>
        <p className="font-semibold">About</p>
        <p className="text-sm mt-3">{DATA.description}</p>
      </div>

      {/* Website */}
      {DATA.website && (
        <a
          href={DATA.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:underline"
        >
          <LinkIcon className="h-4 w-4" />
          {DATA.website.replace(/^https?:\/\//, "")}
        </a>
      )}

      <div className="flex flex-nowrap flex-1 gap-2 overflow-hidden">
        {DATA.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="shrink-0">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Stats */}


      {/* Languages */}
      <div className="space-y-2">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          {DATA.languages.map((lang) => (
            <div
              key={lang.name}
              style={{
                width: `${lang.percent}%`,
                backgroundColor: getLanguageColor(lang.name),
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {DATA.languages.map((lang) => (
            <span key={lang.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: getLanguageColor(lang.name),
                }}
              />

              {lang.name}

              <span className="font-medium text-foreground">
                {lang.percent.toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Repository Info */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="flex items-center gap-2">
          <GitCommitHorizontal className="h-4 w-4" />
          <strong>{nCommits}</strong> Commits
        </span>

        <span className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <strong>{nBranches}</strong> Branches
        </span>

        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <strong>{nTags}</strong> Tags
        </span>

        <span className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <strong>{size}</strong> KB
        </span>

        <span className="flex items-center gap-2">
          <Scale className="h-4 w-4" />
          {DATA.license} License
        </span>
      </div>

      <Separator />

      {/* Contributors */}
      <div>
        <p className="mb-2 font-semibold">Contributors ({DATA.contributors.length})</p>

        <div className="flex flex-row items-center gap-2">
          {DATA.contributors.map((contributor) => (
            <Avatar key={contributor.name}>
              <AvatarImage src={contributor.image} />
              <AvatarFallback>
                {contributor.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Last commit: {DATA.lastCommit}
      </p>
    </div>
  );
}