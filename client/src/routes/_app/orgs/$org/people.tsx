import { createFileRoute } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import {
	useOrganization,
	useOrganizationMembers,
} from "#/hooks/useOrganizations";

export const Route = createFileRoute("/_app/orgs/$org/people")({
	component: RouteComponent,
});

type Translate = ReturnType<typeof useTranslation>["t"];

function formatJoinedDate(date: string, t: Translate) {
	const joined = new Date(date);
	const now = new Date();

	const seconds = Math.floor((now.getTime() - joined.getTime()) / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) {
		return t("orgs.relative.yearsAgo", { count: years });
	}

	if (months > 0) {
		return t("orgs.relative.monthsAgo", { count: months });
	}

	if (days > 0) {
		return t("orgs.relative.daysAgo", { count: days });
	}

	if (hours > 0) {
		return t("orgs.relative.hoursAgo", { count: hours });
	}

	if (minutes > 0) {
		return t("orgs.relative.minutesAgo", { count: minutes });
	}

	return t("orgs.relative.justNow");
}

function RouteComponent() {
	const { t } = useTranslation();
	const { org } = Route.useParams();
	const { data, isLoading, isError } = useOrganization(org);
	const {
		data: members = [],
		isLoading: isMembersLoading,
		isError: isMembersError,
	} = useOrganizationMembers(org);
	const [query, setQuery] = useState("");

	const filteredMembers = useMemo(() => {
		const search = query.trim().toLowerCase();

		if (!search) {
			return members;
		}

		return members.filter((member) =>
			member.name.toLowerCase().includes(search),
		);
	}, [members, query]);

	if (isLoading) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground">
				{t("orgs.notFound")}
			</div>
		);
	}

	return (
		<div className="mx-40 my-5">
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<UserRound className="size-5" />

					<h1 className="text-2xl font-semibold">{t("orgs.people.heading")}</h1>
				</div>

				<p className="text-sm text-muted-foreground">
					{t("orgs.people.subtitle", { name: data.name })}
				</p>
			</div>

			<Separator className="my-5" />

			<div className="flex flex-col gap-3">
				<InputGroup>
					<InputGroupInput
						placeholder={t("orgs.people.searchPlaceholder")}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>

					<InputGroupAddon>
						<Search className="size-4" />
					</InputGroupAddon>

					<InputGroupAddon align="inline-end">
						{t("orgs.people.memberCount", {
							count: filteredMembers.length,
						})}
					</InputGroupAddon>
				</InputGroup>

				{isMembersLoading ? (
					<div className="flex w-full items-center justify-center py-12">
						<Spinner />
					</div>
				) : isMembersError ? (
					<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
						<UserRound className="size-7 text-muted-foreground" />

						<p className="text-sm font-medium">{t("orgs.people.noPeople")}</p>

						<p className="text-sm text-muted-foreground">
							{t("orgs.people.loadFailed")}
						</p>
					</div>
				) : filteredMembers.length > 0 ? (
					<div className="divide-y rounded-md border">
						{filteredMembers.map((member) => (
							<div
								key={member.id}
								className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
							>
								<Avatar className="size-10 shrink-0">
									{member.image && (
										<AvatarImage src={member.image} alt={member.name} />
									)}

									<AvatarFallback>
										{member.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>

								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium">
										{member.name}
									</span>

									<span className="text-xs text-muted-foreground">
										{t("orgs.people.joined", {
											date: formatJoinedDate(member.joinedAt, t),
										})}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
						<UserRound className="size-7 text-muted-foreground" />

						<p className="text-sm font-medium">{t("orgs.people.noPeople")}</p>

						<p className="text-sm text-muted-foreground">
							{query
								? t("orgs.people.nothingMatches", { query })
								: t("orgs.people.noMembersYet")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
