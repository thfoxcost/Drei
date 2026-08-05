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
  hasCommits: boolean;
  created: string;
  langs: Lang[];
  branches: string[];
  defaultBranch: string;
  tags: string[] | null;
  cloneUrl: string;
  commits: Commit[];
  lastCommit: Commit;
  files: RepoFile[];
  size: number;
  contributors: string[];
}