import { Skeleton } from "#/components/ui/skeleton";

const TABS = [
	"Public Profile",
	"Account",
	"Actions",
	"Notifications",
	"Appearance",
];

function SettingsLoading() {
	return (
		<output
			aria-live="polite"
			aria-busy="true"
			aria-label="Loading settings"
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
						{TABS.map((tab) => (
							<Skeleton key={tab} className="h-9 w-full rounded-none" />
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

			<span className="sr-only">Loading settings...</span>
		</output>
	);
}

export default SettingsLoading;
