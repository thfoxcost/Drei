import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import PrNew from "#/components/repo/pulls/pr-new";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Spinner } from "#/components/ui/spinner";
import { useCompareContext } from "./route";

export const Route = createFileRoute("/$username/$repo/compare/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const { _splat } = Route.useParams();
	const { username: owner, repo } = Route.useParams();
	const ctx = useCompareContext();

	if (!_splat) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>{t("compare.invalidTitle")}</AlertTitle>
				<AlertDescription className="text-destructive/80">
					{t("compare.invalidDescription")}
				</AlertDescription>
			</Alert>
		);
	}

	const [base, source] = _splat.split("...");

	if (!base || !source) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>{t("compare.invalidTitle")}</AlertTitle>
				<AlertDescription className="text-destructive/80">
					{t("compare.genericError")}
				</AlertDescription>
			</Alert>
		);
	}

	if (base === source) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>{t("compare.sameBranchTitle")}</AlertTitle>
				<AlertDescription className="text-destructive/80">
					{t("compare.sameBranchDescription")}
				</AlertDescription>
			</Alert>
		);
	}

	if (ctx.isLoading) {
		return (
			<div className="flex items-center justify-center py-8 text-muted-foreground">
				<Spinner className="mr-2" />
				<span>{t("compare.loading")}</span>
			</div>
		);
	}

	if (ctx.isError) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>{t("compare.loadFailed")}</AlertTitle>
				<AlertDescription className="text-destructive/80">
					{ctx.errorMessage || t("compare.loadFailedBody")}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<PrNew
			owner={owner}
			repo={repo}
			base={base}
			source={source}
			compare={ctx.compare}
			duplicatePR={ctx.duplicatePR}
		/>
	);
}
