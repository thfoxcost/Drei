import { getIconUrlForFilePath } from "vscode-material-icons";
import { timeAgo, absoluteDate } from "#/lib/time-ago";
import { getFolderIcon } from "#/lib/folder-icons";

const ICONS_URL = "/icons";

function getFileIcon(filename: string, isFile: boolean): string {
  if (isFile) {
    return getIconUrlForFilePath(filename, ICONS_URL);
  }

  return getFolderIcon(filename);
}

interface CellProps {
  filename: string;
  commitmessage: string;
  date: string;
  isFile: boolean;
}

function Cell({
  filename,
  commitmessage,
  date,
  isFile,
}: CellProps) {
  const message = commitmessage.trim() || "No commit message";

  return (
    <div className="group flex cursor-pointer flex-row items-center gap-4 border border-t-0 px-3 py-2 text-sm transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-[1.2] items-center gap-2.5">
        <img
          src={getFileIcon(filename, isFile)}
          alt=""
          className="h-[18px] w-[18px] shrink-0 object-contain opacity-90 transition-opacity group-hover:opacity-100"
        />

        <span
          className="truncate font-medium text-foreground group-hover:underline group-hover:decoration-muted-foreground/40 group-hover:underline-offset-2"
          title={filename}
        >
          {filename}
        </span>
      </div>

      <span
        className="min-w-0 flex-[2] truncate text-muted-foreground"
        title={message}
      >
        {message}
      </span>

      <span
        className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground"
        title={absoluteDate(date)}
      >
        {timeAgo(date)}
      </span>
    </div>
  );
}

export default Cell;