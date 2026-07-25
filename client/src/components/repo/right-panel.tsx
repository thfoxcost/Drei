import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
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

// The API sometimes duplicates the UTC offset (e.g. "-0700 -0700").
// Keep just the date + time portion for display.
function formatDate(raw: string): string {
  const parts = raw.trim().split(" ");
  return parts.slice(0, 2).join(" ") || raw;
}

interface Lang {
  name: string;
  bytes: number;
  percent: number;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoData {
  name: string;
  owner: string;
  email: string;
  description: string;
  visibility: boolean;
  hasCommits: boolean;
  created: string;
  langs: Lang[];
  branches: string[];
  defaultBranch: string;
  tags: string[] | null;
  cloneUrl: string;
  commits: Commit[];
  lastCommit: Commit;
  files: unknown[];
  size: number;
  contributors: string[];
}

interface RightPanelProps {
  data: RepoData;
}

export default function RightPanel({ data }: RightPanelProps) {
  const sortedLangs = [...(data.langs ?? [])].sort((a, b) => b.percent - a.percent);

  return (
    <div className="w-full max-w-xs space-y-5">
      {/* About */}
      <div>
        <p className="font-semibold">About</p>
        <p
          className={`mt-2 text-sm ${
            data.description ? "text-foreground" : "italic text-muted-foreground"
          }`}
        >
          {data.description || "No description"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{data.visibility ? "Public" : "Private"}</Badge>
        <Badge variant="secondary">{data.defaultBranch}</Badge>
      </div>

      {/* Languages */}
      {sortedLangs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="font-semibold text-sm">Languages</p>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {sortedLangs.map((lang) => (
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
              {sortedLangs.map((lang) => (
                <span key={lang.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getLanguageColor(lang.name) }}
                  />
                  {lang.name}
                  <span className="font-medium text-foreground">
                    {lang.percent.toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Contributors — API only gives usernames, no avatar images */}
      {data.contributors?.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="mb-2 font-semibold text-sm">
              Contributors ({data.contributors.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {data.contributors.map((name) => (
                <Avatar key={name}>
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Last commit */}
      {data.hasCommits && data.lastCommit ? (
        <div className="space-y-1 text-sm">
          <p>
            Last commit:{" "}
            <span className="text-muted-foreground">
              {formatDate(data.lastCommit.date)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {data.lastCommit.message?.trim()} — {data.lastCommit.author}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No commits yet</p>
      )}
    </div>
  );
}