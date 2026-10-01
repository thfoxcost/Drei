import {
	CirclePlay,
	CloudBackup,
	GitBranch,
	Settings,
	Tags,
	UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Backup from "./backup";
import Collab from "./collab";
import General from "./general";

const TabsVerticalLinedDemo = () => {
	const { t } = useTranslation();

	const tabs = [
		{
			name: t("repo.settings.nav.backup"),
			value: "backup",
			icon: CloudBackup,
			content: t("repo.settings.nav.backupDesc"),
		},
		{
			name: t("repo.settings.nav.branches"),
			value: "branches",
			icon: GitBranch,
			content: t("repo.settings.nav.branchesDesc"),
		},
		{
			name: t("repo.settings.nav.tags"),
			value: "tags",
			icon: Tags,
			content: t("repo.settings.nav.tagsDesc"),
		},
		{
			name: t("repo.settings.nav.actions"),
			value: "actions",
			icon: CirclePlay,
			content: t("repo.settings.nav.actionsDesc"),
		},
	];

	return (
		<Tabs
			defaultValue="general"
			orientation="vertical"
			className="mx-60 mt-2 flex w-full flex-row"
		>
			<TabsList className="h-full w-[200px] flex-col items-stretch rounded-none bg-background p-0">
				{/* General */}
				<TabsTrigger
					value="general"
					className="mb-1 w-full justify-start gap-2 text-left data-active:bg-primary/20! data-active:text-primary! data-active:shadow-none! dark:data-active:border-transparent"
				>
					<Settings />
					{t("repo.settings.nav.general")}
				</TabsTrigger>

				<Separator className="my-1" />

				{/* Access */}
				<p className="px-1 py-2 text-xs font-medium tracking-wider text-muted-foreground">
					{t("repo.settings.nav.access")}
				</p>

				<TabsTrigger
					value="collaborators"
					className="w-full justify-start gap-2 text-left"
				>
					<UsersRound />
					{t("repo.settings.nav.collaborators")}
				</TabsTrigger>

				<Separator className="my-2" />

				{/* Code Management */}
				<p className="px-1 py-2 text-xs font-medium tracking-wider text-muted-foreground">
					{t("repo.settings.nav.codeManagement")}
				</p>

				{tabs.map((tab) => {
					const Icon = tab.icon;

					return (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							disabled={tab.value !== "backup"}
							className="w-full justify-start gap-2 text-left"
						>
							<Icon />
							{tab.name}
						</TabsTrigger>
					);
				})}

				<Separator className="my-2" />
			</TabsList>

			<div className="flex-1 px-6">
				{/* General */}
				<TabsContent value="general">
					<General />
				</TabsContent>

				{/* Collaborators */}
				<TabsContent value="collaborators">
					<Collab />
				</TabsContent>

				{/* Code Management */}
				{tabs
					.filter((tab) => tab.value !== "backup")
					.map((tab) => (
						<TabsContent key={tab.value} value={tab.value}>
							<div className="space-y-1">
								<h3 className="font-medium">{tab.name}</h3>
								<p className="text-sm text-muted-foreground">{tab.content}</p>
							</div>
						</TabsContent>
					))}

				<TabsContent value="backup" className="w-full">
					<Backup />
				</TabsContent>
			</div>
		</Tabs>
	);
};

export default TabsVerticalLinedDemo;
