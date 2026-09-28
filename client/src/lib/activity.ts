export type ActivityType =
  | "repo_created"
  | "repo_forked"
  | "issue_opened"
  | "issue_closed"
  | "pr_opened"
  | "pr_closed"
  | "pr_merged"
  | "pr_approved"
  | "push";

export type ActivityActor = {
  id: string;
  username: string;
  avatar: string | null;
};

export type ActivityRepo = {
  owner: string;
  name: string;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  actor: ActivityActor;
  repo: ActivityRepo;
  forkedFrom?: ActivityRepo;
  number?: number;
  title?: string;
  sha?: string;
  message?: string;
  createdAt: string;
};

export type ActivityResponse = {
  items: ActivityItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 8;

function backendUrl(): string {
  const url = import.meta.env.VITE_BACKEND_URL as string | undefined;
  return url && url.length > 0 ? url : "http://localhost:3200";
}

export async function getActivity(
  page: number,
  limit: number = PAGE_SIZE,
): Promise<ActivityResponse> {
  const url = `${backendUrl()}/api/activity?page=${page}&limit=${limit}`;

  // no-store: activity is scoped to the session cookie, so a cached
  // response must never be reused (e.g. after switching users).
  const res = await fetch(url, { credentials: "include", cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to load activity (${res.status})`);
  }

  return res.json();
}

export { PAGE_SIZE };
