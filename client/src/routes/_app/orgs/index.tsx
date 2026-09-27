import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useUserOrganizations } from "#/hooks/useOrganizations";
import { authMiddleware } from "#/lib/middleware";

export const Route = createFileRoute("/_app/orgs/")({
	component: RouteComponent,
	server: {
		middleware: [authMiddleware],
	},
});

function getAvatarUrl(avatar: string | null): string | null {
	if (!avatar) return null;
	return `/uploads/${avatar}`;
}

function RouteComponent() {
	const {
		data: orgs = [],
		isLoading,
		isError,
		refetch,
	} = useUserOrganizations();

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6">
			{isLoading ? (
				<div className="flex h-40 w-full items-center justify-center">
					<Spinner />
				</div>
			) : isError ? (
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<span>Failed to load organizations</span>
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						Retry
					</Button>
				</div>
			) : (
				<div className="flex w-full flex-wrap items-center justify-center gap-4">
					{orgs.map((org) => {
						const avatarUrl = getAvatarUrl(org.avatar);
						return (
							<Link
								key={org.id}
								to="/orgs/$org"
								params={{ org: org.slug }}
								title={org.name}
								aria-label={org.name}
							>
								<Avatar className="size-40 shrink-0 rounded-xl after:rounded-[inherit]">
									{avatarUrl && (
										<AvatarImage
											src={avatarUrl}
											alt={org.name}
											className="rounded-xl"
										/>
									)}
									<AvatarFallback className="rounded-xl">
										{org.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</Link>
						);
					})}

					<Link
						to="/orgs/new"
						aria-label="Create organization"
						className="flex size-40 shrink-0 items-center justify-center rounded-xl bg-accent transition-colors hover:bg-accent/80"
					>
						<Plus size={80} className="text-muted-foreground" />
					</Link>
				</div>
			)}
		</div>
	);
}
