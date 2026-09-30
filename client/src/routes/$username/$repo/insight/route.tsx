import {
	createFileRoute,
	Link,
	Outlet,
	useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$username/$repo/insight")({
	component: RouteComponent,
});

const insights = [
	{
		labelKey: "insights.tabs.pulse",
		to: "/$username/$repo/insight",
	},
	{
		labelKey: "insights.tabs.contributors",
		to: "/$username/$repo/insight/contributors",
	},
	{
		labelKey: "insights.tabs.codeFrequency",
		to: "/$username/$repo/insight/code-frequency",
	},
	{
		labelKey: "insights.tabs.recentCommits",
		to: "/$username/$repo/insight/recent-commits",
	},
] as const;

function RouteComponent() {
	const { t } = useTranslation();
	const { username, repo } = useParams({
		from: "/$username/$repo/insight",
	});

	return (
		<div className="mx-30 my-2 flex gap-4">
			<div className="h-fit w-[300px] overflow-hidden rounded-md border">
				<table className="w-full border-collapse text-sm">
					<tbody>
						{insights.map((insight) => (
							<tr
								key={insight.labelKey}
								className="border-b last:border-b-0 hover:bg-muted/50"
							>
								<td className="px-4 py-3">
									<Link
										to={insight.to}
										params={{
											username,
											repo,
										}}
										activeProps={{
											className: "underline",
										}}
										className="flex items-center gap-2 font-medium hover:underline"
									>
										{t(insight.labelKey)}
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
