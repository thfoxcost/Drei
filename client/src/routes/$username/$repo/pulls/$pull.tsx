import PRdetail from "#/components/repo/pulls/pr-detail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/pulls/$pull")({
	component: RouteComponent,
});

function RouteComponent() {
	const { pull } = Route.useParams();

	return (
		<div className="mx-30 mb-10">
			<div className="pt-1">
				<PRdetail pull={pull} />
			</div>
		</div>
	);
}