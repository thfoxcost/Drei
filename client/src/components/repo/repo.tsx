import { useRepoData } from "@/hooks/useRepoData";
import { Spinner } from "../ui/spinner";
import ArchivedBanner from "./archived-banner";
import { NoRepo } from "./norepo";
import Readme from "./reademe";
import Rightpanel from "./right-panel";
import Cell from "./table/cell";
import Mainheader from "./table/header";
import Tableheader from "./table-header";

interface RepoProps {
	owner: string;
	repo: string;
	branch?: string;
}

function decodeDocContent(content: string): string {
	if (!content) return "";
	try {
		const binary = atob(content);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		return new TextDecoder("utf-8").decode(bytes);
	} catch {
		return "";
	}
}

function Repo({ owner, repo, branch }: RepoProps) {
	const { data: repoData, error } = useRepoData(owner, repo, branch);

	if (error) {
		return (
			<div className="p-10">
				<NoRepo />
			</div>
		);
	}

	if (!repoData) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner />
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
			names: ["license", "license.md", "license.txt", "copying", "copying.md"],
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
				doc.names.includes(file.name.toLowerCase()),
			);

			if (!file || !file.content) return null;

			return {
				name: doc.title,
				content: file.content,
			};
		})
		.filter((doc): doc is { name: string; content: string } => doc !== null);

	const readmeDoc = docs.find((doc) => doc.name === "README");
	const readmeMarkdown = readmeDoc ? decodeDocContent(readmeDoc.content) : "";

	return (
		<>
			<ArchivedBanner owner={owner} repo={repo} />

			<div className="mx-32 flex h-full flex-col overflow-y-auto overflow-x-hidden mb-20">
				<div className="mt-2 flex flex-row justify-between">
					<div className="mr-6 min-w-0 flex-1">
						<Tableheader
							defaultBranch={repoData.defaultBranch}
							activeBranch={branch ?? repoData.defaultBranch}
							owner={owner}
							repo={repo}
							branches={repoData.branches}
							nBranches={repoData.branches.length}
							tags={repoData.tags}
							nTags={repoData.tags?.length ?? 0}
							cloneUrl={repoData.cloneUrl}
							readme={readmeMarkdown}
							files={repoData.files}
						/>

						<Mainheader />

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
								path={file.path}
								branch={branch ?? repoData.defaultBranch}
								owner={owner}
								repo={repo}
							/>
						))}

						{docs.length > 0 && <Readme docs={docs} />}
					</div>

					<div className="w-full max-w-xs shrink-0">
						<Rightpanel
							data={repoData}
							owner={owner}
							repo={repo}
							branch={branch ?? repoData.defaultBranch}
						/>
					</div>
				</div>
			</div>
		</>
	);
}

export default Repo;
