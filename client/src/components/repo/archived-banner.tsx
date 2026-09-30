import { Archive } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRepoData } from "#/hooks/useRepoData";
import { absoluteDate } from "#/lib/time-ago";

interface ArchivedBannerProps {
	owner: string;
	repo: string;
}

function ArchivedBanner({ owner, repo }: ArchivedBannerProps) {
	const { t } = useTranslation();
	const { data: repoData } = useRepoData(owner, repo);

	if (!repoData?.archived) return null;

	const archivedAt = repoData.archivedAt
		? absoluteDate(repoData.archivedAt)
		: null;

	return (
		<div className="flex w-full items-center justify-center gap-2 border-y border-yellow-500/40 bg-yellow-50 px-5 py-2.5 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300 mb-3">
			<Archive className="size-4 shrink-0" />
			<p>
				{archivedAt
					? t("repo.visibility.archivedOn", { date: archivedAt })
					: t("repo.visibility.archivedOnUnknown")}
			</p>
		</div>
	);
}

export default ArchivedBanner;
