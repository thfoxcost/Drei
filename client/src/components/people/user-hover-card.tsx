import { format } from "date-fns";
import { type ReactNode, useMemo, useState } from "react";
import { CountryFlag } from "#/components/flags/country-flag";
import { useTranslation } from "react-i18next";
import { ProfessionIcon } from "#/components/profession-icon";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "#/components/ui/hover-card";
import { type Person, usePeople } from "#/hooks/usePeople";
import { dateFnsLocale } from "#/i18n/lib/format";
import { getCountryCode } from "#/lib/countries";

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function UserCardBody({
	username,
	person,
}: {
	username: string;
	person: Person | undefined;
}) {
	const { t } = useTranslation();
	const code = getCountryCode(person?.country ?? null);

	if (!person) {
		return <p className="text-sm text-muted-foreground">@{username}</p>;
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2.5">
				<Avatar className="size-10">
					{person.avatar && (
						<AvatarImage src={person.avatar} alt={person.username} />
					)}
					<AvatarFallback>{getInitials(person.username)}</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<p className="truncate font-bold">{person.username}</p>
					<p className="truncate text-xs text-muted-foreground">
						@{person.username}
					</p>
				</div>
			</div>
			{person.profession && (
				<p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
					<ProfessionIcon className="size-3.5 shrink-0" />
					<span className="truncate">{person.profession}</span>
				</p>
			)}
			<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
				{code ? (
					<span className="flex items-center gap-1.5">
						<CountryFlag
							countryCode={code}
							style={{ width: "18px", borderRadius: "3px" }}
						/>
						{person.country}
					</span>
				) : (
					<span>—</span>
				)}
				<span>
					{t("people.reposTable.joined", {
						date: format(new Date(person.joinedAt), "MMM, yyyy", {
							locale: dateFnsLocale(),
						}),
					})}
				</span>
			</div>
		</div>
	);
}

interface UserHoverCardProps {
	username: string;
	children: ReactNode;
	/**
	 * Pre-resolved profile. Pass it when the surrounding view already has the
	 * people list; omit it and the card looks the user up on first hover.
	 */
	person?: Person;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	className?: string;
}

/**
 * Shows the people-directory profile card for a username.
 *
 * The lookup shares the `["people"]` cache entry with the people tables, and
 * stays disabled until the card is first opened so hover affordances on pages
 * that never render those tables don't add a request to every page load.
 */
export function UserHoverCard({
	username,
	children,
	person: personProp,
	side = "bottom",
	align = "start",
	className,
}: UserHoverCardProps) {
	const [open, setOpen] = useState(false);
	const needsLookup = personProp === undefined;
	const { data: people = [] } = usePeople({ enabled: needsLookup && open });
	const lookedUp = useMemo(
		() =>
			people.find(
				(candidate) =>
					candidate.username.toLowerCase() === username.toLowerCase(),
			),
		[people, username],
	);
	const person = personProp ?? lookedUp;

	return (
		<HoverCard open={open} onOpenChange={setOpen}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent side={side} align={align} className={className}>
				<UserCardBody username={username} person={person} />
			</HoverCardContent>
		</HoverCard>
	);
}
