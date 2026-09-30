import {
	Check,
	Copy,
	Download,
	FileCode,
	FileQuestionMark,
	Pencil,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { ButtonGroup } from "#/components/ui/button-group";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { formatBytes } from "#/i18n/lib/format";
import { backendUrl } from "#/lib/backend-url";
import type { BundledLanguage } from "@/components/kibo-ui/code-block";
import {
	CodeBlock,
	CodeBlockBody,
	CodeBlockContent,
	CodeBlockHeader,
	CodeBlockItem,
} from "@/components/kibo-ui/code-block";
import { Markdown } from "../markdown-view";

interface CodeblockProps {
	code?: string;
	language?: string;
	filename?: string;
	lineCount?: number;
	locCount?: number;
	byteSize?: number;
	owner?: string;
	repo?: string;
	branch?: string;
	filePath?: string;
}

type ActiveTab = "preview" | "code" | "blame";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

const KNOWN_DOC_FILES = new Set([
	"readme",
	"license",
	"copying",
	"code_of_conduct",
	"contributing",
	"security",
	"changelog",
	"changes",
	"authors",
	"contributors",
	"faq",
	"roadmap",
	"install",
	"development",
	"developing",
	"support",
	"governance",
	"todo",
	"notice",
]);

function canPreviewFile(filename: string): boolean {
	if (!filename) return false;
	const lower = filename.toLowerCase();
	const ext = lower.slice(lower.lastIndexOf("."));
	if (MARKDOWN_EXTENSIONS.has(ext)) return true;
	const basename = lower.replace(/\.[^.]+$/, "");
	return KNOWN_DOC_FILES.has(basename);
}

function Codeblock({
	code = "",
	language = "plaintext",
	filename = "",
	lineCount = 0,
	locCount = 0,
	byteSize = 0,
	owner,
	repo,
	branch,
	filePath,
}: CodeblockProps) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);
	const canPreview = canPreviewFile(filename);

	const [activeTab, setActiveTab] = useState<ActiveTab>(
		canPreview ? "preview" : "code",
	);

	useEffect(() => {
		setActiveTab(canPreview ? "preview" : "code");
	}, [canPreview]);

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const blob = new Blob([code], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.href = url;
		a.download = filename;
		a.click();

		URL.revokeObjectURL(url);
	};

	const handleRaw = () => {
		if (!owner || !repo || !branch || !filePath) return;
		const base = backendUrl();
		window.location.href = `${base}/api/repos/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${filePath}`;
	};

	// Don't render the code block/header for empty files.
	if (!code.trim()) {
		return (
			<div className="flex w-full items-center justify-center">
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileQuestionMark />
						</EmptyMedia>

						<EmptyTitle>{t("repo.readme.nothingToSee")}</EmptyTitle>

						<EmptyDescription>{t("repo.readme.emptyFile")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	const data = [
		{
			language,
			filename,
			code,
		},
	];

	return (
		<div className="w-full overflow-hidden rounded-md border">
			<CodeBlockHeader className="flex h-10 items-center border-b bg-muted-foreground/10 px-2">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as ActiveTab)}
					className="h-7"
				>
					<TabsList className="h-7 rounded-md bg-transparent p-0">
						{canPreview && (
							<TabsTrigger
								value="preview"
								className="h-7 rounded-md px-3 text-sm"
							>
								{t("repo.code.previewTab")}
							</TabsTrigger>
						)}

						<TabsTrigger value="code" className="h-7 rounded-md px-3 text-sm">
							{t("repo.code.codeTab")}
						</TabsTrigger>

						<TabsTrigger
							value="blame"
							disabled
							className="h-7 rounded-md px-3 text-sm"
						>
							{t("repo.code.blameTab")}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="ml-auto flex items-center gap-3 pr-1">
					<span className="whitespace-nowrap text-xs text-muted-foreground">
						{t("repo.code.fileStats", {
							lines: lineCount,
							loc: locCount,
						})}{" "}
						{`\u00b7`} {formatBytes(byteSize)}
					</span>

					<ButtonGroup>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									disabled
									aria-label={t("repo.code.editFile")}
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("repo.code.editFile")}</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									aria-label={t("repo.code.deleteFile")}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("repo.code.deleteFile")}</TooltipContent>
						</Tooltip>
					</ButtonGroup>

					<ButtonGroup>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									aria-label={t("repo.code.viewRawFile")}
									onClick={handleRaw}
								>
									<FileCode className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("repo.code.viewRawFile")}</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									aria-label={t("repo.code.copyFile")}
									onClick={handleCopy}
								>
									{copied ? (
										<Check className="h-3.5 w-3.5 text-green-500" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{copied
									? t("repo.code.copiedExclaim")
									: t("repo.code.copyToClipboard")}
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									aria-label={t("repo.code.downloadFile")}
									onClick={handleDownload}
								>
									<Download className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("repo.code.downloadFile")}</TooltipContent>
						</Tooltip>
					</ButtonGroup>
				</div>
			</CodeBlockHeader>

			{activeTab === "preview" && canPreview ? (
				<div className="p-6">
					<Markdown content={code} />
				</div>
			) : (
				<CodeBlock
					data={data}
					defaultValue={language}
					className="w-full rounded-none border-0"
				>
					<CodeBlockBody>
						{(item) => (
							<CodeBlockItem key={item.language} value={item.language}>
								<CodeBlockContent
									language={item.language as BundledLanguage}
									className="text-xs"
								>
									{item.code}
								</CodeBlockContent>
							</CodeBlockItem>
						)}
					</CodeBlockBody>
				</CodeBlock>
			)}
		</div>
	);
}

export default Codeblock;
