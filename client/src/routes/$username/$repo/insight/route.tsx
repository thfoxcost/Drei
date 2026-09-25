import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/insight")({
	component: RouteComponent,
});

const insights = [
	{
		name: "Pulse",
		to: "/$username/$repo/insight",
	},
	{
		name: "Contributors",
		to: "/$username/$repo/insight/contributors",
	},
	{
		name: "Code Frequency",
		to: "/$username/$repo/insight/code-frequency",
	},
	{
		name: "Recent Commits",
		to: "/$username/$repo/insight/recent-commits",
	},
] as const;

function RouteComponent() {
	return (
		<div className="mx-30 my-2 flex gap-4">
			<div className="h-fit w-[300px] overflow-hidden rounded-md border">
				<table className="w-full border-collapse text-sm">
					<tbody>
						{insights.map((insight) => (
							<tr
								key={insight.name}
								className="border-b last:border-b-0 hover:bg-muted/50"
							>
								<td className="px-4 py-3">
									<Link
										to={insight.to}
										params={{
											username: "theFoxCost",
											repo: "test12",
										}}
										className="flex items-center gap-2 font-medium hover:underline"
									>
										{insight.name}
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="min-w-0 flex-1">
				<Outlet />
			</div>
		</div>
	);
}