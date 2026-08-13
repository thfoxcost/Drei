import type { Repo } from "#/hooks/useUserRepos";
import { authClient } from "#/lib/auth-client";
import Clock from "@/components/clock-06";
import Dash from "./dash";
import SystemHealth from "./health";
import Profile from "./profile";
import Repos from "./repos";
import Weather from "./weather-07";

interface MainProps {
	repos: Repo[];
}

function Main({ repos }: MainProps) {
	const { data: session } = authClient.useSession();

	const username = session?.user.name;

	return (
		<div className="flex flex-1 min-h-0 gap-6 p-6 overflow-hidden">
			<div className="flex flex-col gap-4">
				<Profile />
				<div className="flex h-26 w-auto items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
					@{username ?? "username"}
				</div>
			</div>

			<div className="flex flex-1 gap-6 min-w-0">
				<div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">
					<Dash />
					<Repos repos={repos} />
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
