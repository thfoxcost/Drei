import { useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import RepoStarsheader from "./repo-stars-header";
import Rightpanel from "./right-panel";
import Tableheader from "./table-header";
import Cell from "./table/cell";
import Mainheader from "./table/header";
import { NoRepo } from "./norepo";
import Readme from "./reademe";

interface RepoProps {
  owner: string;
  repo: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface RepoFile {
  name: string;
  path: string;
  size: number;
  hash: string;
  type: boolean;
  content: string;
  lastCommit: Commit;
  isNested: boolean
}

interface Lang {
  name: string;
  bytes: number;
  percent: number;
}

interface RepoData {
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

function Repo({ owner, repo }: RepoProps) {

  const [repoData, setRepoData] = useState<RepoData | null>(null);

  useEffect(() => {
    async function getRepo() {
      try {
        const res = await fetch(
          `http://localhost:3200/api/repos/${owner}/${repo}`
        );

        if (!res.ok) {
          return;
        }

        const data: RepoData = await res.json();
        setRepoData(data);
      } catch (err) {
        console.error(err);
      }
    }

    getRepo();
  }, [owner, repo]);

  if (!repoData) {
    return (
      <div className="p-10">
        <NoRepo />
      </div>
    );
  }


  const readme = repoData.files.find((file) =>
  [
    "readme.md",
    "readme.mdx",
    "readme.markdown",
    "readme.txt",
    "readme",
  ].includes(file.name.toLowerCase())
);
  return (
    <div className="flex flex-col px-10 h-full overflow-y-auto mx-16">
      <RepoStarsheader reponame={repoData.name} visibility={repoData.visibility} />

      <Separator />

      <div className="flex flex-row justify-between gap-8 mt-4">
        <div className="flex-1 min-w-0 mr-8">
          <Tableheader
            defaultBranch={repoData.defaultBranch}
            branches={repoData.branches}
            nBranches={repoData.branches.length}
            tags={repoData.tags}
            nTags={repoData.tags?.length ?? 0}
            cloneUrl={repoData.cloneUrl}
          />

          <Mainheader
            owner={repoData.owner}
            lastcommit={repoData.lastCommit.message}
            commithash={repoData.lastCommit.hash.slice(0, 7)}
            commitDate={repoData.lastCommit.date}
            commitNum={repoData.commits.length.toLocaleString()}
          />

          {repoData.files
            .filter((file) => !file.isNested)
            .map((file) => (
              <Cell
                key={file.path}
                filename={file.name}
                commitmessage={
                  file.lastCommit.message.trim() === ""
                    ? repoData.lastCommit.message
                    : file.lastCommit.message
                }
                date={
                  file.lastCommit.date.trim() === ""
                    ? repoData.lastCommit.date
                    : file.lastCommit.date
                }
                isFile={file.type}
              />
            ))}
          {readme?.content && <Readme content={readme.content} />}        </div>

        <div className="w-full max-w-xs shrink-0">
          <Rightpanel data={repoData} />
        </div>
      </div>
    </div>
  );
}

export default Repo;