"use client";

import { useNavigate } from "@tanstack/react-router";
import * as linguistLanguages from "linguist-languages";
import { GitFork } from "lucide-react";
import type { RepoFile } from "#/types/repo";
import { Separator } from "@/components/ui/separator";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ContributionChart } from "./chart-area-default";
import { ActivityRadarChart } from "./chart-radar";
import { type Contributor, ContributorAvatars } from "./contributor-avatars";
import { RepoVisibilitySettings } from "./hooks/repo-visibility-settings";
import { useRepoItemsVisibility } from "./hooks/use-repo-items-visibility";
import { getAvailableItems } from "./repo-items";

export type { Contributor };

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

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = bytes / 1024 ** i;
	return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
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
	commitActivity: { date: string; count: number }[];
	lastCommit: Commit;
	files: unknown[];
	size: number;
	contributors: Contributor[];
	issueCount: number;
	isFork: boolean;
	forkedFromOwner: string;
	forkedFromName: string;
}

interface RightPanelProps {
	data: RepoData;
	owner: string;
	repo: string;
	branch: string;
}

export default function RightPanel({
	data,
	owner,
	repo,
	branch,
}: RightPanelProps) {
	const navigate = useNavigate();
	const sortedLangs = [...(data.langs ?? [])].sort(
		(a, b) => b.percent - a.percent,
	);
	const { visibility, setItemVisible } = useRepoItemsVisibility();
	const availableItems = getAvailableItems(data.files as RepoFile[]);
	const visibleItems = availableItems.filter(
		(item) => visibility[item.id] ?? true,
	);
	const contributors = data.contributors ?? [];

	return (
		<div className="w-full max-w-xs space-y-6">
			{/* About */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<p className="font-semibold">About</p>
					<RepoVisibilitySettings
						visibility={visibility}
						onToggle={setItemVisible}
						availableItems={availableItems}
					/>
				</div>
				<p
					className={`text-sm ${
						data.description
							? "text-foreground"
							: "italic text-muted-foreground"
					}`}
				>
					{data.description || "No description"}
				</p>
				{data.isFork && data.forkedFromOwner && data.forkedFromName && (
					<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<GitFork className="h-3 w-3" />
						Forked from{" "}
						<button
							type="button"
							className="cursor-pointer bg-transparent border-none p-0 hover:underline text-xs text-muted-foreground"
							onClick={() =>
								navigate({
									to: "/$username/$repo",
									params: {
										username: data.forkedFromOwner,
										repo: data.forkedFromName,
									},
								})
							}
						>
							{data.forkedFromOwner}/{data.forkedFromName}
						</button>
					</p>
				)}
			</div>

			{visibleItems.length > 0 && (
				<nav className="flex flex-col gap-2.5">
					{visibleItems.map((item) => {
						const Icon = item.icon;

						let value: React.ReactNode = null;

						switch (item.id) {
							case "size":
								value = formatBytes(data.size);
								break;
							default:
								value = null;
						}

						const handleClick = () => {
							if (item.filePath) {
								navigate({
									to: "/$username/$repo/blob/$branch/$" as any,
									params: {
										username: owner,
										repo,
										branch,
										_splat: item.filePath,
									},
								});
							}
						};

						const content = (
							<div className="flex items-center justify-between text-sm text-muted-foreground transition-colors hover:text-white">
								<div className="flex items-center gap-2">
									<Icon size={16} />
									<span>{item.name}</span>
								</div>

								{value && <span className="text-foreground">{value}</span>}
							</div>
						);

						if (item.filePath) {
							return (
								<button
									key={item.id}
									type="button"
									onClick={handleClick}
									className="cursor-pointer bg-transparent border-none p-0 w-full text-left"
								>
									{content}
								</button>
							);
						}

						return (
							<a
								key={item.id}
								href={item.href}
								className="flex items-center justify-between text-sm text-muted-foreground transition-colors hover:text-white"
							>
								<div className="flex items-center gap-2">
									<Icon size={16} />
									<span>{item.name}</span>
								</div>

								{value && <span className="text-foreground">{value}</span>}
							</a>
						);
					})}
				</nav>
			)}

			<Separator />
			<Tabs defaultValue="activity" className="w-[400px] h-[208px]">
				<TabsList>
					<TabsTrigger value="activity">Activity</TabsTrigger>
					<TabsTrigger value="contribution">Contribution</TabsTrigger>
				</TabsList>
				<TabsContent value="activity">
					<ContributionChart data={data.commitActivity} />
				</TabsContent>
				<TabsContent value="contribution" className="h-[208px]">
					<ActivityRadarChart
						commitCount={data.commits.length}
						issueCount={data.issueCount ?? 0}
					/>
				</TabsContent>
			</Tabs>

			{/* Contributors — API returns unique contributors with username + avatar */}
			{contributors.length > 0 && (
				<>
					<Separator />
					<div className="space-y-2">
						<p className="text-sm font-semibold">
							Contributors
							<Badge variant="secondary" className="mx-1">
								{contributors.length}
							</Badge>
						</p>
						<ContributorAvatars contributors={contributors} />
					</div>
				</>
			)}
			{/* Languages */}
			{sortedLangs.length > 0 && (
				<>
					<Separator />
					<div className="space-y-2">
						<p className="text-sm font-semibold">Languages</p>
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

						{sortedLangs.some((lang) => lang.percent > 0) && (
							<div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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
						)}
					</div>
				</>
			)}

			<Separator />
			<div className=" text-sm">
				<p className="text">
					<span className="font-medium text-white">Created at : </span>

					{new Date(data.created).toLocaleString("en-GB", {
						year: "numeric",
						month: "short",
						day: "2-digit",
					})}
				</p>
			</div>
		</div>
	);
}
