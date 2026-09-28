"use client";

import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BookMarked,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Badge } from "#/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { type Person, usePeople } from "#/hooks/usePeople";
import { authClient } from "#/lib/auth-client";
import { uploadsUrl } from "#/lib/backend-url";
import { countries } from "#/lib/countries";
import { cn } from "#/lib/utils.ts";

const MAX_VISIBLE_ORGS = 3;
const PAGE_SIZE_OPTIONS = [5, 8, 12, 13];

type SortKey = "smart" | "username" | "email" | "lastActive" | "joinedAt";

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function getCountryCode(name: string | null): string | null {
	if (!name) return null;
	return (
		countries.find((c) => c.name.toLowerCase() === name.toLowerCase())?.code ??
		null
	);
}

function getOrgAvatarUrl(avatar: string | null): string | null {
	return uploadsUrl(avatar);
}

function sortPeople(
	people: Person[],
	key: SortKey,
	dir: "asc" | "desc",
): Person[] {
	const factor = dir === "asc" ? 1 : -1;
	return [...people].sort((a, b) => {
		switch (key) {
			case "smart":
				// Logical default: online first, then most recently active
				// (never-active last), then alphabetical.
				if (a.online !== b.online) return a.online ? -1 : 1;
				{
					const ta = a.lastActive ? new Date(a.lastActive).getTime() : 0;
					const tb = b.lastActive ? new Date(b.lastActive).getTime() : 0;
					if (ta !== tb) return tb - ta;
				}
				return a.username.localeCompare(b.username);
			case "username":
				return a.username.localeCompare(b.username) * factor;
			case "email":
				return a.email.localeCompare(b.email) * factor;
			case "lastActive": {
				const ta = a.lastActive ? new Date(a.lastActive).getTime() : 0;
				const tb = b.lastActive ? new Date(b.lastActive).getTime() : 0;
				return (ta - tb) * factor;
			}
			case "joinedAt":
				return (
					(new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) *
					factor
				);
			default:
				return 0;
		}
	});
}

interface SortHeaderProps {
	label: string;
	sortKey: SortKey;
	activeKey: SortKey;
	dir: "asc" | "desc";
	onSort: (key: SortKey) => void;
}

function SortHeader({
	label,
	sortKey,
	activeKey,
	dir,
	onSort,
}: SortHeaderProps) {
	const active = activeKey === sortKey;
	return (
		<button
			type="button"
			onClick={() => onSort(sortKey)}
			className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground"
		>
			{label}
			{active ? (
				dir === "asc" ? (
					<ArrowUp className="size-3.5" />
				) : (
					<ArrowDown className="size-3.5" />
				)
			) : (
				<ArrowUpDown className="size-3.5 opacity-50" />
			)}
		</button>
	);
}

function PlainHeader({ label }: { label: string }) {
	return <span>{label}</span>;
}

export function PeopleTable() {
	const { data: people = [], isLoading, isError, refetch } = usePeople();
	const { data: session } = authClient.useSession();
	const selfId = session?.user?.id;
	const [sortKey, setSortKey] = useState<SortKey>("smart");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(13);
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState<"all" | "online" | "offline">("all");
	const [country, setCountry] = useState<string | null>(null);
	const [org, setOrg] = useState<string | null>(null);

	const availableCountries = useMemo(() => {
		const found = new Set<string>();
		for (const person of people) {
			if (person.country) found.add(person.country);
		}
		return Array.from(found).sort((a, b) => a.localeCompare(b));
	}, [people]);

	const availableOrgs = useMemo(() => {
		const found = new Map<string, string>();
		for (const person of people) {
			for (const membership of person.organizations) {
				if (!found.has(membership.slug)) {
					found.set(membership.slug, membership.name);
				}
			}
		}
		return Array.from(found.entries())
			.map(([slug, name]) => ({ slug, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [people]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		// The logged-in user always counts as online (badge, filter, sort).
		const ranked = people.map((person) =>
			person.id === selfId ? { ...person, online: true } : person,
		);
		return ranked.filter((person) => {
			if (
				q &&
				!person.username.toLowerCase().includes(q) &&
				!person.email.toLowerCase().includes(q)
			) {
				return false;
			}
			if (status === "online" && !person.online) return false;
			if (status === "offline" && person.online) return false;
			if (country && person.country !== country) return false;
			if (
				org &&
				!person.organizations.some((membership) => membership.slug === org)
			) {
				return false;
			}
			return true;
		});
	}, [people, selfId, query, status, country, org]);

	function resetPage() {
		setPageIndex(0);
	}

	const sorted = useMemo(
		() => sortPeople(filtered, sortKey, sortDir),
		[filtered, sortKey, sortDir],
	);
	const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
	const safePageIndex = Math.min(pageIndex, pageCount - 1);
	const page = sorted.slice(
		safePageIndex * pageSize,
		safePageIndex * pageSize + pageSize,
	);

	function handleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
		setPageIndex(0);
	}

	if (isLoading) {
		return (
			<Card className="p-0">
				<div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
					<Spinner />
					<span>Loading people...</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="p-0">
				<div className="flex flex-col items-center gap-2 p-10">
					<p className="text-sm text-muted-foreground">
						Failed to load people.
					</p>
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						Retry
					</Button>
				</div>
			</Card>
		);
	}

	if (people.length === 0) {
		return (
			<Card className="p-0">
				<p className="p-10 text-center text-sm text-muted-foreground">
					No people found.
				</p>
			</Card>
		);
	}

	const rangeStart = sorted.length === 0 ? 0 : safePageIndex * pageSize + 1;
	const rangeEnd = Math.min(safePageIndex * pageSize + pageSize, sorted.length);

	const statusLabel =
		status === "all" ? "Status" : status === "online" ? "Online" : "Offline";
	const countryLabel = country ?? "Country";
	const orgLabel =
		org === null
			? "Organization"
			: (availableOrgs.find((o) => o.slug === org)?.name ?? "Organization");

	return (
		<div className="w-full space-y-2.5">
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="min-w-52 flex-1">
					<InputGroupInput
						placeholder="Search by name or email..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							resetPage();
						}}
					/>
					<InputGroupAddon>
						<Search size={16} />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{sorted.length} result{sorted.length === 1 ? "" : "s"}
					</InputGroupAddon>
				</InputGroup>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label="Filter by status"
						>
							{statusLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={status}
							onValueChange={(value) => {
								setStatus(value as "all" | "online" | "offline");
								resetPage();
							}}
						>
							<DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="online">
								Online
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="offline">
								Offline
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label="Filter by country"
						>
							{countryLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={country ?? "all"}
							onValueChange={(value) => {
								setCountry(value === "all" ? null : value);
								resetPage();
							}}
						>
							<DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
							{availableCountries.map((name) => (
								<DropdownMenuRadioItem key={name} value={name}>
									{name}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label="Filter by organization"
						>
							{orgLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={org ?? "all"}
							onValueChange={(value) => {
								setOrg(value === "all" ? null : value);
								resetPage();
							}}
						>
							<DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
							{availableOrgs.map((item) => (
								<DropdownMenuRadioItem key={item.slug} value={item.slug}>
									{item.name}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Card className="p-0">
				<div className="w-full overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr className="border-b text-left font-medium text-muted-foreground">
								<th className="px-3 py-2 whitespace-nowrap">
									<SortHeader
										label="Username"
										sortKey="username"
										activeKey={sortKey}
										dir={sortDir}
										onSort={handleSort}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label="Profession" />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<SortHeader
										label="Email"
										sortKey="email"
										activeKey={sortKey}
										dir={sortDir}
										onSort={handleSort}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label="Organizations" />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label="Top repository" />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label="Country" />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label="Status" />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<SortHeader
										label="Joined"
										sortKey="joinedAt"
										activeKey={sortKey}
										dir={sortDir}
										onSort={handleSort}
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{page.map((person) => {
								const code = getCountryCode(person.country);
								const visibleOrgs = person.organizations.slice(
									0,
									MAX_VISIBLE_ORGS,
								);
								const extraOrgs =
									person.organizations.length - visibleOrgs.length;
								return (
									<tr
										key={person.id}
										className="border-b last:border-b-0 hover:bg-muted/50"
									>
										<td className="px-3 py-2 whitespace-nowrap">
											<div className="flex items-center gap-2">
												<Avatar className="size-6">
													{person.avatar && (
														<AvatarImage
															src={person.avatar}
															alt={person.username}
														/>
													)}
													<AvatarFallback>
														{getInitials(person.username)}
													</AvatarFallback>
												</Avatar>
												<Link
													to="/$username"
													params={{ username: person.username }}
													className="text-foreground hover:text-primary font-bold"
												>
													{person.username}
												</Link>
											</div>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<div className="text-muted-foreground">
												{person.profession ?? "—"}
											</div>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<a
												href={`mailto:${person.email}`}
												className="hover:text-primary hover:underline"
											>
												{person.email}
											</a>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											{person.organizations.length === 0 ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<div className="flex items-center">
													<div className="flex -space-x-2">
														{visibleOrgs.map((org) => (
															<Link
																key={org.id}
																to="/orgs/$org"
																params={{ org: org.slug }}
																title={org.name}
															>
																<Avatar className="size-6 rounded-md ring-2 ring-background after:rounded-[inherit]">
																	{getOrgAvatarUrl(org.avatar) && (
																		<AvatarImage
																			src={
																				getOrgAvatarUrl(org.avatar) as string
																			}
																			alt={org.name}
																			className="rounded-md"
																		/>
																	)}
																	<AvatarFallback className="rounded-md text-[10px]">
																		{getInitials(org.name)}
																	</AvatarFallback>
																</Avatar>
															</Link>
														))}
													</div>
													{extraOrgs > 0 && (
														<span
															className="ml-1.5 text-xs text-muted-foreground"
															title={person.organizations
																.slice(MAX_VISIBLE_ORGS)
																.map((o) => o.name)
																.join(", ")}
														>
															+{extraOrgs}
														</span>
													)}
												</div>
											)}
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											{person.topRepo ? (
												<Link
													to="/$username/$repo"
													params={{
														username: person.topRepo.owner,
														repo: person.topRepo.name,
													}}
													className="flex max-w-45 items-center gap-1.5 text-foreground hover:text-primary"
													title={`${person.topRepo.owner}/${person.topRepo.name}`}
												>
													<BookMarked className="size-4 shrink-0 text-muted-foreground" />
													<span className="truncate font-medium">
														{person.topRepo.owner}/{person.topRepo.name}
													</span>
												</Link>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											{!person.country || !code ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<span title={person.country}>
													<ReactCountryFlag
														countryCode={code}
														svg
														style={{
															width: "1.5em",
															height: "1.5em",
														}}
													/>
												</span>
											)}
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<Badge
												variant={person.online ? "success-light" : "secondary"}
												title={
													person.lastActive
														? `Last active ${formatDistanceToNowStrict(
																new Date(person.lastActive),
																{ addSuffix: true },
															)}`
														: "Never active"
												}
											>
												<span
													className={cn(
														"size-1.5 rounded-full",
														person.online
															? "bg-success"
															: "bg-muted-foreground",
													)}
												/>
												{person.online ? "Online" : "Offline"}
											</Badge>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<div className="text-muted-foreground">
												{format(new Date(person.joinedAt), "MMM, yyyy")}
											</div>
										</td>
									</tr>
								);
							})}
							{page.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-3 py-10 text-center text-sm text-muted-foreground"
									>
										No people match the current search and filters.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Card>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-muted-foreground">
					Showing {rangeStart}–{rangeEnd} of {sorted.length}{" "}
					{sorted.length === 1 ? "person" : "people"}
				</p>
				<div className="flex items-center gap-2">
					<select
						aria-label="Rows per page"
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setPageIndex(0);
						}}
						className="rounded-md border border-border bg-background px-2 py-1 text-sm"
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{size} / page
							</option>
						))}
					</select>
					<Button
						variant="outline"
						size="icon-sm"
						disabled={safePageIndex === 0}
						onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
						aria-label="Previous page"
					>
						<ChevronLeft />
					</Button>
					<span className="text-sm text-muted-foreground">
						{safePageIndex + 1} / {pageCount}
					</span>
					<Button
						variant="outline"
						size="icon-sm"
						disabled={safePageIndex >= pageCount - 1}
						onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
						aria-label="Next page"
					>
						<ChevronRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
