import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import {
	AlertTriangle,
	ArrowLeftRight,
	Check,
	Code2,
	Copy,
	FileDiff,
	GitBranch,
	GitCommit,
	Loader2,
	SquareDot,
	SquareMinus,
	SquarePlus,
	Users,
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDuplicatePR } from "#/hooks/PRs/use-duplicate-pr";
import { usePRCommits } from "#/hooks/PRs/use-pr-commits";
import {
	type BranchCompare,
	usePullCompare,
} from "#/hooks/PRs/use-pull-compare";
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard";
import { useRepoData } from "#/hooks/useRepoData";
import { dateFnsLocale } from "#/i18n/lib/format";
import type { Commit } from "#/types/repo";
import CodeCommitBlock from "@/components/repo/commits/code-commit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/$username/$repo/compare")({
	component: CompareComponent,
});

interface CompareContextValue {
	branches: string[];
	defaultBranch: string;
	base: string;
	source: string;
	compare: BranchCompare | undefined;
	isLoading: boolean;
	isError: boolean;
	errorMessage: string;
	hasComparison: boolean;
	duplicatePR: { duplicate: boolean; number: number | null } | undefined;
	isDuplicateLoading: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompareContext() {
	const ctx = useContext(CompareContext);
	if (!ctx)
		throw new Error("useCompareContext must be used within CompareProvider");
	return ctx;
}

type ChangedFileStatus = "added" | "changed" | "removed";

type ChangedFile = {
	name: string;
	status: ChangedFileStatus;
	additions: number;
	deletions: number;
};

function ChangedFilesItem({ file }: { file: ChangedFile }) {
	const maxSquares = 5;
	const total = file.additions + file.deletions;

	const additionSquares =
		total === 0 ? 0 : Math.round((file.additions / total) * maxSquares);

	const deletionSquares = total === 0 ? 0 : maxSquares - additionSquares;

	return (
		<div className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0">
			{file.status === "added" && (
				<SquarePlus className="size-4 shrink-0 text-green-600 dark:text-green-500" />
			)}

			{file.status === "changed" && (
				<SquareDot className="size-4 shrink-0 text-yellow-500 dark:text-yellow-400" />
			)}

			{file.status === "removed" && (
				<SquareMinus className="size-4 shrink-0 text-red-600 dark:text-red-500" />
			)}

			<span className="min-w-0 flex-1 truncate">{file.name}</span>

			<span className="flex shrink-0 items-center gap-0.5">
				{Array.from({ length: additionSquares }).map((_, index) => (
					<span
						key={`add-${index}`}
						className="size-2 rounded-[1px] bg-green-500"
					/>
				))}

				{Array.from({ length: deletionSquares }).map((_, index) => (
					<span
						key={`remove-${index}`}
						className="size-2 rounded-[1px] bg-red-500"
					/>
				))}
			</span>

			<span className="flex shrink-0 items-center gap-2 text-xs">
				{file.additions > 0 && (
					<span className="text-green-600 dark:text-green-500">
						+{file.additions}
					</span>
				)}

				{file.deletions > 0 && (
					<span className="text-red-600 dark:text-red-500">
						-{file.deletions}
					</span>
				)}
			</span>
		</div>
	);
}

function CommitDialogRow({
	commit,
	isLast,
	owner,
	repo,
}: {
	commit: Commit;
	isLast: boolean;
	owner: string;
	repo: string;
}) {
	const { t } = useTranslation();
	const { isCopied, copyToClipboard } = useCopyToClipboard();
	const shortHash = commit.hash.slice(0, 7);
	const title = commit.message.split("\n")[0];

	return (
		<div
			className={`flex items-center justify-between gap-2 px-4 py-3 ${
				!isLast ? "border-b" : ""
			}`}
		>
			<div className="min-w-0 flex-1">
				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					className="block truncate text-base font-medium leading-tight hover:text-blue-400 hover:underline"
				>
					{title}
				</Link>

				<div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
					<Avatar className="size-6">
						<AvatarFallback className="text-[11px]">
							{commit.author.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<span className="truncate">
						{t("pulls.commits.committed", {
							author: commit.author,
							time: formatDistanceToNowStrict(new Date(commit.date), {
								addSuffix: true,
								locale: dateFnsLocale(),
							}),
						})}
					</span>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					className="font-mono text-sm text-muted-foreground hover:text-foreground"
				>
					{shortHash}
				</Link>

				<button
					type="button"
					onClick={() => copyToClipboard(commit.hash)}
					aria-label={
						isCopied ? t("common.actions.copied") : t("pulls.commits.copyHash")
					}
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					{isCopied ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
				</button>

				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					aria-label={t("pulls.commits.viewCommit")}
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<Code2 className="size-4" />
				</Link>
			</div>
		</div>
	);
}

function CommitsDialog({
	open,
	onOpenChange,
	owner,
	repo,
	base,
	source,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	owner: string;
	repo: string;
	base: string;
	source: string;
}) {
	const { t } = useTranslation();
	const { data: commits, isLoading } = usePRCommits(owner, repo, base, source);
	const commitCount = commits?.length ?? 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isLoading
							? t("compare.commits")
							: t("compare.commitsCount", { count: commitCount })}
					</DialogTitle>
				</DialogHeader>

				<div className="max-h-[60vh] overflow-y-auto rounded-md border">
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							<span>{t("compare.loadingCommits")}</span>
						</div>
					) : !commits || commits.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground">
							{t("compare.noCommits")}
						</div>
					) : (
						<div>
							{commits.map((commit, i) => (
								<CommitDialogRow
									key={commit.hash}
									commit={commit}
									owner={owner}
									repo={repo}
									isLast={i === commits.length - 1}
								/>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function BranchCombobox({
	placeholder,
	branches,
	value,
	onValueChange,
	disabled,
}: {
	placeholder: string;
	branches: string[];
	value: string;
	onValueChange: (val: string) => void;
	disabled?: boolean;
}) {
	return (
		<Combobox
			value={value || null}
			onValueChange={(val) => {
				if (val) onValueChange(val);
			}}
		>
			<ComboboxInput
				placeholder={placeholder}
				className="w-81"
				disabled={disabled}
			/>

			<ComboboxContent>
				<ComboboxList className="m-1">
					{branches.map((branch) => (
						<ComboboxItem key={branch} value={branch} className="gap-2">
							<GitBranch className="size-4 shrink-0 text-muted-foreground" />

							<span className="truncate">{branch}</span>
						</ComboboxItem>
					))}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export function CompareComponent() {
	const { t } = useTranslation();
	const { username: owner, repo } = Route.useParams();
	const navigate = useNavigate();
	const pathname = useRouterState().location.pathname;

	const { data: repoData, isLoading: repoLoading } = useRepoData(owner, repo);

	const branches = repoData?.branches ?? [];
	const defaultBranch = repoData?.defaultBranch ?? "main";

	const comparison = pathname.split("/compare/")[1];
	const hasComparison = !!comparison && comparison.includes("...");

	const [baseFromUrl, sourceFromUrl] = hasComparison
		? comparison.split("...")
		: ["", ""];

	const [base, setBase] = useState(baseFromUrl);
	const [source, setSource] = useState(sourceFromUrl);

	useEffect(() => {
		if (hasComparison) {
			setBase(baseFromUrl);
			setSource(sourceFromUrl);
		} else {
			setBase(defaultBranch);
			setSource("");
		}
	}, [hasComparison, baseFromUrl, sourceFromUrl, defaultBranch]);

	const handleBaseChange = (val: string) => {
		setBase(val);
		if (val && source && val !== source) {
			navigate({
				to: `/${owner}/${repo}/compare/${val}...${source}`,
				replace: true,
			});
		}
	};

	const handleSourceChange = (val: string) => {
		setSource(val);
		if (base && val && base !== val) {
			navigate({
				to: `/${owner}/${repo}/compare/${base}...${val}`,
				replace: true,
			});
		}
	};

	const {
		data: compare,
		isLoading: compareLoading,
		isError: compareError,
		error: compareErrorObj,
	} = usePullCompare(owner, repo, base, source);

	const { data: duplicatePR, isLoading: isDuplicateLoading } = useDuplicatePR(
		owner,
		repo,
		source,
		base,
	);

	const [commitsOpen, setCommitsOpen] = useState(false);

	const title = t(
		hasComparison ? "compare.headingCreate" : "compare.headingReview",
	);

	const description = t(
		hasComparison ? "compare.subtitleCreate" : "compare.subtitleReview",
	);

	const stats = compare
		? {
				commits: compare.ahead,
				filesChanged: compare.files.length,
				contributors: 1,
			}
		: null;

	const contextValue: CompareContextValue = useMemo(
		() => ({
			branches,
			defaultBranch,
			base,
			source,
			compare,
			isLoading: compareLoading,
			isError: compareError,
			errorMessage: compareErrorObj?.message ?? "",
			hasComparison,
			duplicatePR,
			isDuplicateLoading,
		}),
		[
			branches,
			defaultBranch,
			base,
			source,
			compare,
			compareLoading,
			compareError,
			compareErrorObj,
			hasComparison,
			duplicatePR,
			isDuplicateLoading,
		],
	);

	return (
		<CompareContext.Provider value={contextValue}>
			<div>
				<div className="mx-20 flex flex-col">
					<span className="text-2xl font-medium">{title}</span>

					<span className="text-sm text-muted-foreground">{description}</span>

					<div className="mt-2 flex w-full items-center rounded-md border border-dashed bg-accent/20 p-2">
						<svg
							className="ml-1 mr-2 size-4 shrink-0 text-muted-foreground"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 16 16"
						>
							<path
								fill="currentColor"
								d="M9.146 5.854a.5.5 0 1 0 .708-.708L8.707 4H10.5A1.5 1.5 0 0 1 12 5.5v4.55a2.5 2.5 0 1 0 1 0V5.5A2.5 2.5 0 0 0 10.5 3H8.707l1.147-1.146a.5.5 0 0 0-.708-.708l-2 2a.5.5 0 0 0 0 .708zM14 12.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m-8-9a2.5 2.5 0 0 1-2 2.45v4.55A1.5 1.5 0 0 0 5.5 12h1.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L7.293 13H5.5A2.5 2.5 0 0 1 3 10.5V5.95A2.5 2.5 0 1 1 6 3.5m-1 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0"
							/>
						</svg>
						<div className="flex items-center gap-2">
							<div className="flex flex-col">
								<BranchCombobox
									placeholder={t("compare.baseBranchPlaceholder")}
									branches={branches}
									value={base}
									onValueChange={handleBaseChange}
									disabled={repoLoading}
								/>
							</div>

							<ArrowLeftRight className="size-4 shrink-0 text-muted-foreground" />

							<div className="flex flex-col">
								<BranchCombobox
									placeholder={t("compare.compareBranchPlaceholder")}
									branches={branches}
									value={source}
									onValueChange={handleSourceChange}
									disabled={repoLoading}
								/>
							</div>
						</div>
					</div>

					<span className="mt-1 flex items-start">
						<svg
							className="mt-1 size-5 shrink-0 text-muted-foreground"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<g
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							>
								<circle cx="8" cy="8" r="6.25" />
								<path d="m8 5.25v0m0 6v-3.5" />
							</g>
						</svg>

						<span className="text-xs leading-5 text-muted-foreground">
							{t("compare.helper")}
						</span>
					</span>

					{hasComparison && compareLoading && (
						<div className="my-2 flex items-center justify-center gap-2 rounded-md border bg-accent/20 py-4 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							<span>{t("compare.comparing")}</span>
						</div>
					)}

					{hasComparison && compareError && (
						<div className="my-2 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 py-3 px-3 text-sm text-destructive">
							<AlertTriangle className="size-4 shrink-0" />
							<span>
								{compare?.mergeable === false
									? t("compare.cannotMergeCleanly")
									: t("compare.compareFailed", {
											message:
												compareErrorObj?.message ?? t("compare.unknownError"),
										})}
							</span>
						</div>
					)}

					{stats && (
						<div className="my-2 flex items-center justify-around gap-3 rounded-md border bg-accent/20 py-2 text-sm">
							<button
								type="button"
								onClick={() => setCommitsOpen(true)}
								className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
							>
								<GitCommit className="size-4" />

								<span className="font-semibold text-foreground">
									{stats.commits}
								</span>

								<span>{t("compare.stats.commits")}</span>
							</button>

							<span className="flex items-center gap-1.5 text-muted-foreground">
								<FileDiff className="size-4.5" />

								<span className="font-semibold text-foreground">
									{stats.filesChanged}
								</span>

								<span>{t("compare.stats.filesChanged")}</span>
							</span>

							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Users className="size-4" />

								<span className="font-semibold text-foreground">
									{stats.contributors}
								</span>

								<span>{t("compare.stats.contributors")}</span>
							</span>
						</div>
					)}

					<Outlet />
				</div>

				{hasComparison && compare && (
					<div className="mx-5 mt-5 text-sm">
						<div className="flex items-center gap-2">
							<FileDiff className="size-4 text-muted-foreground" />

							<span>
								{/*
									`<Trans>` keeps this sentence translatable while
									restoring the original `<strong>` emphasis and the
									green/red colouring on the addition and deletion
									counts. The catalog string owns the word order and
									the named tags are the styling hooks.
								*/}
								<Trans
									i18nKey="compare.summaryTrans"
									values={{
										count: compare.files.length,
										filesChanged: t("compare.stats.filesChanged"),
										additionsCount: compare.diffs.reduce(
											(s, d) => s + d.additions,
											0,
										),
										additionsLabel: t("compare.additions"),
										deletionsCount: compare.diffs.reduce(
											(s, d) => s + d.deletions,
											0,
										),
										deletionsLabel: t("compare.deletions"),
									}}
									components={{
										files: <span className="font-semibold" />,
										additions: (
											<span className="font-semibold text-green-600 dark:text-green-500" />
										),
										deletions: (
											<span className="font-semibold text-red-600 dark:text-red-500" />
										),
									}}
								/>
							</span>
						</div>

						<div className="mt-3 rounded-md border">
							{compare.files.map((file) => (
								<ChangedFilesItem
									key={file.path}
									file={{
										name: file.path,
										status: file.action as ChangedFileStatus,
										additions:
											compare.diffs.find((d) => d.path === file.path)
												?.additions ?? 0,
										deletions:
											compare.diffs.find((d) => d.path === file.path)
												?.deletions ?? 0,
									}}
								/>
							))}
						</div>

						<div className="mb-5 mt-2">
							{compare.diffs.map((diff) => (
								<CodeCommitBlock key={diff.path} diff={diff} />
							))}
						</div>
					</div>
				)}
			</div>

			<CommitsDialog
				open={commitsOpen}
				onOpenChange={setCommitsOpen}
				owner={owner}
				repo={repo}
				base={base}
				source={source}
			/>
		</CompareContext.Provider>
	);
}
