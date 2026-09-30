import { useTranslation } from "react-i18next";

function Actions() {
	const { t } = useTranslation();

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-6">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted/50">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-muted-foreground"
					>
						<path d="m10.215 4.56l9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23m-3.573 2.084l-8.034 4.686A2 2 0 0 1 5 19V5M2 2l20 20" />
					</svg>
				</div>

				<h1 className="text-lg font-semibold">
					{t("repo.empty.actions.title")}
				</h1>

				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					{t("repo.empty.actions.description")}
				</p>
			</div>
		</div>
	);
}

export default Actions;
