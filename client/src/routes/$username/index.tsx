import { createFileRoute } from "@tanstack/react-router";
import Dash from "#/components/home/dash";
import { NoRepo } from "#/components/repo/norepo";

export const Route = createFileRoute("/$username/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { username } = Route.useParams();

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			<Dash username={username} />
			<div className="flex items-center justify-center">
				<NoRepo />
			</div>
		</div>
	);
}
