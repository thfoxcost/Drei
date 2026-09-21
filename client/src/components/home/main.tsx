import type { Repo } from "#/hooks/useUserRepos";
import Clock from "@/components/clock-06";
import Dash from "./dash";
import SystemHealth from "./health";
import Profile from "./profile";
import Repos from "./repos";
import Weather from "./weather-07";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "@tanstack/react-router";

interface MainProps {
	repos: Repo[];
}

function Main({ repos }: MainProps) {
	const navigate = useNavigate()

	return (
		<div className="flex flex-1 min-h-0 gap-6 p-6 overflow-hidden">
			<div className="flex flex-col gap-3">
				<Profile />
				<div className="flex flex-col gap-2">
					<div className="flex items-center">
						<span className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M6.25 12a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM5.5 9.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75M6.25 5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM9 12.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75m.75-4.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM9 5.75A.75.75 0 0 1 9.75 5h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 9 5.75M13.25 12a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm-.75-2.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75M13.25 5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5z" />
								<path d="M2 20V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17q0 .26-.063.5H20a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.2-.4l-.5-.375a.75.75 0 0 1 .9-1.2l.5.375c.504.378.8.97.8 1.6v8a2 2 0 0 1-2 2h-3.562a1 1 0 0 1-.166-.018Q16.138 22 16 22h-3.75a.75.75 0 0 1-.75-.75V19h-3v2.25a.75.75 0 0 1-.75.75H4a2 2 0 0 1-2-2m2 .5h3v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25h3a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H4a.5.5 0 0 0-.5.5v17a.5.5 0 0 0 .5.5" />
							</svg>
							Organizations
						</span>

						<button
							type="button"
							onClick={() => navigate({ to: "/orgs/new" })}
							className="ml-auto flex items-center justify-center rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="size-3"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M3 13h8v8h2v-8h8v-2h-8V3h-2v8H3z"
								/>
							</svg>
						</button>
					</div>
					<div className="flex gap-4">
						<Avatar className="size-13 rounded-md">
							<AvatarImage
								src="https://api.dicebear.com/10.x/voxel-bot/svg?seed=Felix"
								alt="Emma Wilson"
								className="rounded-md"
							/>
							<AvatarFallback className="rounded-md">EW</AvatarFallback>
						</Avatar>
						<Avatar className="size-13 rounded-md">
							<AvatarImage
								src="https://api.dicebear.com/10.x/voxel-bot/svg?seed=mfv6ufz9"
								alt="Emma Wilson"
								className="rounded-md"
							/>
							<AvatarFallback className="rounded-md">EW</AvatarFallback>
						</Avatar>
						<Avatar className="size-13 rounded-md">
							<AvatarImage
								src="https://api.dicebear.com/10.x/voxel-bot/svg?seed=xzul1l7y"
								alt="Emma Wilson"
								className="rounded-md"
							/>
							<AvatarFallback className="rounded-md">EW</AvatarFallback>
						</Avatar>
						<Avatar className="size-13 rounded-md">
							<AvatarImage
								src="https://api.dicebear.com/10.x/voxel-bot/svg?seed=0eesdh1u"
								alt="Emma Wilson"
								className="rounded-md"
							/>
							<AvatarFallback className="rounded-md">EW</AvatarFallback>
						</Avatar>

						<Avatar className="size-13 rounded-md">
							<AvatarImage
								src="https://api.dicebear.com/10.x/voxel-bot/svg?seed=e0gtu01t"
								alt="Emma Wilson"
								className="rounded-md"
							/>
							<AvatarFallback className="rounded-md">EW</AvatarFallback>
						</Avatar>
					</div>
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
