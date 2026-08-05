import { Separator } from "../ui/separator";
import RepoStarsheader from "./repo-stars-header";
import Rightpanel from "./right-panel";
import Tableheader from "./table-header";
import Cell from "./table/cell";
import Mainheader from "./table/header";
import { NoRepo } from "./norepo";
import Readme from "./reademe";
import { useRepoData } from "@/hooks/useRepoData";

interface RepoProps {
  owner: string;
  repo: string;
}

function Repo({ owner, repo }: RepoProps) {
  const { data: repoData } = useRepoData(owner, repo);

  if (!repoData) {
    return (
      <div className="p-10">
        <NoRepo />
      </div>
    );
  }

  const documentFiles = [
    {
      title: "README",
      names: [
        "readme.md",
        "readme.mdx",
        "readme.markdown",
        "readme.txt",
        "readme",
      ],
    },
    {
      title: "License",
      names: [
        "license",
        "license.md",
        "license.txt",
        "copying",
        "copying.md",
      ],
    },
    {
      title: "Changelog",
      names: ["changelog", "changelog.md", "changes", "changes.md"],
    },
    {
      title: "Contributing",
      names: ["contributing", "contributing.md"],
    },
    {
      title: "Security",
      names: ["security", "security.md"],
    },
    {
      title: "Code of Conduct",
      names: ["code_of_conduct.md", "code-of-conduct.md"],
    },
    {
      title: "Support",
      names: ["support", "support.md"],
    },
    {
      title: "Authors",
      names: ["authors", "authors.md"],
    },
  ];

  const docs = documentFiles
    .map((doc) => {
      const file = repoData.files.find((file) =>
        doc.names.includes(file.name.toLowerCase())
      );

      if (!file) return null;

      return {
        name: doc.title,
        content: file.content,
      };
    })
    .filter(
      (doc): doc is { name: string; content: string } => doc !== null
    );

  return (
    <div className="mx-16 flex h-full flex-col overflow-y-auto px-15">
      <div className="mt-2 flex flex-row justify-between">
        <div className="mr-6 min-w-0 flex-1">
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

          {docs.length > 0 && <Readme docs={docs} />}
        </div>

        <div className="w-full max-w-xs shrink-0">
          <Rightpanel data={repoData} />
        </div>
      </div>
    </div>
  );
}

export default Repo;