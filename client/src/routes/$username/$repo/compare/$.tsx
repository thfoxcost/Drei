import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import PrNew from "#/components/repo/pulls/pr-new";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Spinner } from "#/components/ui/spinner";
import { useCompareContext } from "./route";

export const Route = createFileRoute("/$username/$repo/compare/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const { _splat } = Route.useParams();
	const { username: owner, repo } = Route.useParams();
	const ctx = useCompareContext();

	if (!_splat) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>Invalid comparison</AlertTitle>
				<AlertDescription className="text-destructive/80">
					Please provide a valid base and source branch.
				</AlertDescription>
			</Alert>
		);
	}

	const [base, source] = _splat.split("...");

	if (!base || !source) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>Invalid comparison</AlertTitle>
				<AlertDescription className="text-destructive/80">
					Something went wrong. Please try again or use a different comparison.
				</AlertDescription>
			</Alert>
		);
	}

	if (base === source) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>Same branch selected</AlertTitle>
				<AlertDescription className="text-destructive/80">
					Base and compare branches must be different. Please select a different
					compare branch.
				</AlertDescription>
			</Alert>
		);
	}

	if (ctx.isLoading) {
		return (
			<div className="flex items-center justify-center py-8 text-muted-foreground">
				<Spinner className="mr-2" />
				<span>Loading comparison...</span>
			</div>
		);
	}

	if (ctx.isError) {
		return (
			<Alert className="border-none bg-destructive/10 text-destructive">
				<TriangleAlertIcon />
				<AlertTitle>Failed to load comparison</AlertTitle>
				<AlertDescription className="text-destructive/80">
					{ctx.errorMessage || "Could not compare these branches."}
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
