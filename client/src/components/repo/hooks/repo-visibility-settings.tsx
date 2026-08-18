"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RepoItem } from "../repo-items";

interface RepoVisibilitySettingsProps {
	visibility: Record<string, boolean>;
	onToggle: (id: string, visible: boolean) => void;
	availableItems: RepoItem[];
}

export function RepoVisibilitySettings({
	visibility,
	onToggle,
	availableItems,
}: RepoVisibilitySettingsProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-muted-foreground hover:text-white"
					aria-label="Customize sidebar sections"
				>
					<Settings2 size={16} />
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Sidebar sections</DialogTitle>
					<DialogDescription>
						Choose what shows up in the sidebar. Saved to this browser only.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-2">
					{availableItems.map((item) => (
						<div key={item.id} className="flex items-center justify-between">
							<Label
								htmlFor={`toggle-${item.id}`}
								className="text-sm font-normal"
							>
								{item.name}
							</Label>
							<Switch
								id={`toggle-${item.id}`}
								checked={visibility[item.id] ?? true}
								onCheckedChange={(checked) => onToggle(item.id, checked)}
							/>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}