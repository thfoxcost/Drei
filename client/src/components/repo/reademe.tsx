import {
	BookUser,
	FileText,
	HeartHandshake,
	History,
	type LucideIcon,
	Scale,
	Shield,
	Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "./markdown-view";

interface DocFile {
	name: string;
	content: string;
}

interface ReadmeProps {
	docs: DocFile[];
}

const iconMap: Record<string, LucideIcon> = {
	README: FileText,
	License: Scale,
	Changelog: History,
	Contributing: Users,
	Security: Shield,
	Support: HeartHandshake,
	Authors: BookUser,
};

function decodeDocContent(content: string): string {
	if (!content) return "";
	try {
		const binary = atob(content);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		return new TextDecoder("utf-8").decode(bytes);
	} catch {
		return "";
	}
}

export default function Readme({ docs }: ReadmeProps) {
	if (docs.length === 0) {
		return null;
	}

	return (
		<div className="mt-3 mb-40 overflow-hidden rounded-lg border">
			<Tabs defaultValue={docs[0].name} className="mt-3 gap-0">
				<div className="w-full overflow-x-auto border-b bg-muted/10">
					<div className="min-w-max">
						<TabsList
							variant="line"
							className="h-12 w-max rounded-none bg-transparent p-0"
						>
							{docs.map((doc) => {
								const Icon = iconMap[doc.name] ?? FileText;

								return (
									<TabsTrigger
										key={doc.name}
										value={doc.name}
										className="
              mx-2 h-11 shrink-0 gap-2 rounded-t-md border-0
              whitespace-nowrap
              data-[state=active]:bg-muted
              group-data-horizontal/tabs:after:bottom-[-1px]
              not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30
              not-data-active:hover:group-data-horizontal/tabs:after:opacity-100
              mb-[12px]
            "
									>
										<Icon className="size-4 shrink-0" />
										<span className="text-sm whitespace-nowrap">
											{doc.name}
										</span>
									</TabsTrigger>
								);
							})}
						</TabsList>
					</div>
				</div>

				{docs.map((doc) => (
					<TabsContent key={doc.name} value={doc.name} className="m-0 p-6">
						<Markdown content={decodeDocContent(doc.content)} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
