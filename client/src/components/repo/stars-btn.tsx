import { ChevronDownIcon, StarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StartsBtn() {
	const { t } = useTranslation();

	return (
		<ButtonGroup>
			<Button variant="secondary">
				<StarIcon className="size-4" aria-hidden="true" />
				<span>{t("repo.stars.label")}</span>
				<Badge variant="secondary">2.4k</Badge>
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="secondary" size="icon">
						<ChevronDownIcon className="size-4" aria-hidden="true" />
						<span className="sr-only">
							{t("common.actions.toggleDropdown")}
						</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="min-w-40">
					<p className="text-xs text-muted-foreground">
						{t("repo.stars.saveComingSoon")}
					</p>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}
