import { createFileRoute } from "@tanstack/react-router";
import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarImage,
} from "#/components/ui/avatar";
import { useInitials } from "#/hooks/useInitials";
import { Button } from "#/components/ui/button";
import { GraduationCap, Mail, TriangleAlert, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { Separator } from "#/components/ui/separator";

export const Route = createFileRoute("/_app/orgs/$org/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { org } = Route.useParams();
	const orgInitials = useInitials(org);
	// if the user == author erturn trrue
	let isUserAdmin = false
	let isFollowing = true
	return (
		<div className="mx-15 my-5">
			<div className="flex justify-between">
				<div className="flex gap-5">
					<Avatar className='after:rounded-[inherit] size-40'>
						<AvatarImage
							src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'
							alt='Hallie Richards'
							className='rounded-xl'
						/>
						<AvatarFallback>{orgInitials}</AvatarFallback>
						<AvatarBadge className='-bottom-1 -right-2 bg-amber-600 group-data-[size=default]/avatar:size-5 dark:bg-amber-400'>
							<span className='sr-only'>Away</span>
						</AvatarBadge>
					</Avatar>
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<h1 className="text-5xl font-bold">{org}</h1>

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="text-muted-foreground transition-colors hover:text-foreground"
									>
										<GraduationCap className="size-6" />
										<span className="sr-only">Educational organization</span>
									</button>
								</TooltipTrigger>

								<TooltipContent>
									<p>Educational</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">Open Source</Badge>
							<Badge variant="secondary">Software</Badge>
							<Badge variant="secondary">Developer Tools</Badge>
							<Badge variant="secondary">Git</Badge>
							<Badge variant="secondary">Community</Badge>
						</div>
						<span className="text-sm text-muted-foreground max-w-4xl">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellat non eum pariatur, laudantium ducimus totam, neque ipsa veniam ratione distinctio similique obcaecati dolor optio unde mollitia vel alias suscipit ut.</span>
						<div className="mt-auto flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								className="w-fit gap-1 rounded-full pl-0.5"
							>
								<Avatar className="size-6 border-2 border-background">
									<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
									<AvatarFallback>CH</AvatarFallback>
								</Avatar>

								<span className="text-xs">@shadcn</span>
							</Button>
							<div className="h-5 w-px bg-border" />
							<div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
								<Users className="size-4" />
								<span>
									<span className="text-foreground">16.5k</span> followers
								</span>

								<span className="mx-1 text-muted-foreground/60">•</span>

								<Mail className="size-4" />

								<span className="font-semibold text-foreground">
									thefoxcost@gmail.com
								</span>

								<span className="mx-1 text-muted-foreground/60">•</span>

								<span>
									Created: <span className="text-foreground">16 Sep 2026</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{isFollowing ?
					<Button variant="destructive" disabled={isUserAdmin}>
						<TriangleAlert />
						Following
					</Button>
					:
					<Button disabled={isUserAdmin}>
						Follow
					</Button>
				}


			</div>
			<Separator className="my-5"/>
			<div className="">
				
			</div>
		</div>
	);
}
