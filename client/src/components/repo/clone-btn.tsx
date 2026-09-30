import { Code, CopyIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "../ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../ui/input-group";

export function CloneButton() {
	const { t } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
					<Code className="h-4 w-4" />
					<span>{t("repo.clone.label")}</span>

					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d="m7 10 5 5 5-5z" />
					</svg>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-96 p-0" align="end">
				<Field className="w-full max-w-xs">
					<InputGroup>
						<InputGroupInput defaultValue="https://reui.com/share" readOnly />
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								variant="ghost"
								size="icon-xs"
								onClick={() => toast.success(t("repo.clone.copied"))}
								aria-label={t("repo.clone.copied")}
							>
								<CopyIcon className="size-4" />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</Field>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
