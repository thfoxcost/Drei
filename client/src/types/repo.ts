import type { Contributor } from "@/components/repo/right-panel";
export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoFile {
  name: string;
  path: string;
  size: number;
  hash: string;
  type: boolean;
  content: string;
  lastCommit: Commit;
  isNested: boolean;
}

export interface Lang {
  name: string;
  bytes: number;
  percent: number;
}

export interface RepoData {
  name: string;
  owner: string;
  email: string;
  description: string;
  visibility: boolean;
  logo: string;
  website: string;
  archived: boolean;
  archivedAt: string;
  hasCommits: boolean;
  created: string;
  langs: Lang[];
  branches: string[];
  defaultBranch: string;
  tags: string[] | null;
  cloneUrl: string;
  commits: Commit[];
  commitActivity: { date: string; count: number }[];
  lastCommit: Commit;
  files: RepoFile[];
  size: number;
  contributors: Contributor[];
}