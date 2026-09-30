import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { dateFnsLocale } from "#/i18n/lib/format";

interface LatestcommitsboxProps {
	author?: string;
	message?: string;
	hash?: string;
	date?: string;
}

function parseApiDate(dateStr: string): Date | null {
	const cleaned = dateStr
		.replace(/(\+\d{2})(\d{2})\s+\+\d{4}$/, "$1:$2")
		.replace(" ", "T")
		.replace(/ (?=\+)/, "");
	const d = new Date(cleaned);
	return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(
	dateStr: string,
	translate: (key: string, options?: Record<string, unknown>) => string,
): string {
	const d = parseApiDate(dateStr);
	if (!d) return "";

	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffDays === 0) return translate("common.time.today");
	if (diffDays === 1) return translate("common.time.yesterday");
	if (diffDays < 7)
		return translate("common.time.daysAgo", { count: diffDays });

	if (d.getFullYear() === now.getFullYear()) {
		return format(d, "MMM d", { locale: dateFnsLocale() });
	}
	return format(d, "MMM d, yyyy", { locale: dateFnsLocale() });
}

function Latestcommitsbox({
	author,
	message,
	hash,
	date,
}: LatestcommitsboxProps) {
	const { t } = useTranslation();
	const shortHash = hash ? hash.slice(0, 7) : "";
	const displayDate = date ? formatDate(date, t) : "";

	return (
		<div className="border rounded-md p-2 text-sm flex flex-row items-center justify-between">
			<div className="flex flex-row gap-2">
				<Avatar size="sm">
					<AvatarImage src="https://github.com/shadcn.png" />
					<AvatarFallback>
						{author ? author.slice(0, 2).toUpperCase() : "U"}
					</AvatarFallback>
				</Avatar>
				<span className="text-semibold hover:underline">{author}</span>
				<span className="text-muted-foreground hover:underline hover:text-blue-500 cursor-pointer">
					{message}
				</span>
			</div>
			<span className="text-muted-foreground text-xs">
				{shortHash}
				{" · "}
				{displayDate}
			</span>
		</div>
	);
}

export default Latestcommitsbox;
