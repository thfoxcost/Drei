import { useNavigate } from "@tanstack/react-router";
import { useUserOrganizations } from "#/hooks/useOrganizations";
import { authClient } from "#/lib/auth-client";
import Clock from "@/components/clock-06";
import Dash from "./dash";
import SystemHealth from "./health";
import LatestActivity from "./latestactivity";
import Profile from "./profile";
import Weather from "./weather-07";

function Main() {
	const navigate = useNavigate();
	const { data: orgs = [] } = useUserOrganizations();
	const { data: session } = authClient.useSession();
	const pinnedOrgs = orgs.filter((org) => org.pinned).slice(0, 5);

	return (
		<div className="flex flex-1 min-h-0 gap-6 p-6 overflow-hidden">
			<div className="flex flex-col gap-3 h-auto shrink-0 self-start">
				<Profile />
				<div className="flex flex-col gap-2">
					{pinnedOrgs.length > 0 ? (
						<div className="flex gap-4">
							{pinnedOrgs.map((org) => (
								<button
									key={org.id}
									type="button"
									onClick={() =>
										navigate({ to: "/orgs/$org", params: { org: org.slug } })
									}
									className="cursor-pointer"
								>
									<div className="flex size-13 items-center justify-center overflow-hidden rounded-md bg-muted">
										{org.avatar ? (
											<img
												src={`${import.meta.env.VITE_BACKEND_URL}/uploads/${org.avatar}`}
												alt={org.name}
												className="size-full object-cover"
											/>
										) : (
											<span className="font-medium">
												{org.name.slice(0, 2).toUpperCase()}
											</span>
										)}
									</div>
								</button>
							))}
						</div>
					) : (
						<div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-border px-4 text-sm text-muted-foreground">
							@{session?.user.name ?? "username"}
						</div>
					)}
				</div>
			</div>

			<div className="flex flex-1 gap-6 min-w-0">
				<div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">
					<Dash />
					<LatestActivity />
				</div>

				<div className="flex flex-col gap-5 shrink-0">
					<Clock />
					<Weather />
					<SystemHealth />
				</div>
			</div>
		</div>
	);
}

export default Main;
