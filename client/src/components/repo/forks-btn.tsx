import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronDownIcon, GitFork } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ForkOwner {
	username: string;
	avatar: string;
}

interface ForksResponse {
	count: number;
	forks: ForkOwner[];
	hasFork: boolean;
}

function getInitials(name: string): string {
	return (
		name
			?.split(" ")
			.map((w) => w[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() ?? "??"
	);
}

export function ForksBtn({ disabled = false }: { disabled?: boolean }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { username, repo } = useParams({ strict: false });

	const { data } = useQuery<ForksResponse>({
		queryKey: ["forks", username, repo],
		queryFn: async () => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/forks`,
				{ credentials: "include" },
			);
			if (!res.ok) throw new Error(t("repo.fork.failed"));
			return res.json();
		},
		staleTime: 30_000,
	});

	const count = data?.count ?? 0;
	const forks = data?.forks ?? [];

	function handleMainClick() {
		navigate({
			to: "/$username/$repo/forks",
			params: { username, repo },
		});
	}

	return (
		<ButtonGroup>
			<Button variant="secondary" disabled={disabled} onClick={handleMainClick}>
				<GitFork className="size-4" aria-hidden="true" />
				<span>{t("repo.fork.label")}</span>
				{count > 0 && <Badge variant="secondary">{count}</Badge>}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="secondary" size="icon" disabled={disabled}>
						<ChevronDownIcon className="size-4" aria-hidden="true" />
						<span className="sr-only">
							{t("common.actions.toggleDropdown")}
						</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="min-w-52">
					<DropdownMenuLabel>
						{count > 0
							? t("repo.fork.forkedTimes", { count })
							: t("repo.fork.noForks")}
					</DropdownMenuLabel>

					{forks.length > 0 && <DropdownMenuSeparator />}

					{forks.map((fork) => (
						<DropdownMenuItem
							key={fork.username}
							className="flex items-center gap-2"
							onClick={() =>
								navigate({
									to: "/$username",
									params: { username: fork.username },
								})
							}
						>
							<Avatar size="sm">
								<AvatarImage
									src={fork.avatar || undefined}
									alt={fork.username}
								/>
								<AvatarFallback>{getInitials(fork.username)}</AvatarFallback>
							</Avatar>
							<span>{fork.username}</span>
						</DropdownMenuItem>
					))}

					{forks.length === 0 && (
						<p className="px-2 py-1.5 text-xs text-muted-foreground">
							{t("repo.fork.firstForkHint")}
						</p>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}
