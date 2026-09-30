import { useTranslation } from "react-i18next";

import { Skeleton } from "#/components/ui/skeleton";

/** Row count only — these values are React keys, never rendered. */
const TAB_ROWS = 5;

function SettingsLoading() {
	const { t } = useTranslation();

	return (
		<output
			aria-live="polite"
			aria-busy="true"
			aria-label={t("common.states.loadingSettings")}
			className="mx-20 block py-5"
		>
			<div className="flex w-full flex-row">
				<div className="flex flex-col">
					<div className="mb-5 flex flex-row items-center gap-3">
						<Skeleton className="size-9 rounded-full" />

						<div className="flex flex-col justify-start gap-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-40" />
						</div>
					</div>

					<div className="mt-2 flex w-[200px] flex-col items-stretch gap-1">
						{Array.from({ length: TAB_ROWS }, (_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: positional skeleton rows
							<Skeleton key={index} className="h-9 w-full rounded-none" />
						))}
					</div>
				</div>

				<div className="flex-1 space-y-4 px-6">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-px w-full rounded-none" />

					{["max-w-md", "max-w-sm", "max-w-lg"].map((width) => (
						<Skeleton key={width} className={`h-9 w-full ${width}`} />
					))}
				</div>
			</div>

			<span className="sr-only">{t("common.states.loadingSettings")}</span>
		</output>
	);
}

export default SettingsLoading;
