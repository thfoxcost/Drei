import { createFileRoute } from "@tanstack/react-router";
import { GitBranch, InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertAction, AlertTitle } from "#/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$username/$repo/compare/")({
	component: CompareIndex,
});

export function CompareIndex() {
	const { t } = useTranslation();

	return (
		<Alert className="border-blue-500/50 bg-blue-500/10 py-3 text-blue-500">
			<InfoIcon />
			<AlertTitle>{t("compare.selectBranchesTitle")}</AlertTitle>
			<AlertAction>
				<Button
					variant="outline"
					className="gap-1.5 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
					disabled
				>
					<GitBranch className="size-3.5" />
					{t("compare.selectBranchesButton")}
				</Button>
			</AlertAction>
		</Alert>
	);
}
