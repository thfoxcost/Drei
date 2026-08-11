import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "#/components/repo/issues/markdown";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";

const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const maxImageSize = 5 * 1024 * 1024;

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	id?: string;
	placeholder?: string;
	rows?: number;
	disabled?: boolean;
	uploadUrl: string;
}

// MarkdownEditor is a Write/Preview editor for issue descriptions. It keeps a
// plain textarea for the Markdown source (so existing plain-text descriptions
// keep working) and adds a preview pane plus an image upload button that
// inserts the uploaded image URL into the source at the cursor position.
function MarkdownEditor({
	value,
	onChange,
	id,
	placeholder,
	rows = 8,
	disabled,
	uploadUrl,
}: MarkdownEditorProps) {
	const [tab, setTab] = useState<"write" | "preview">("write");
	const [uploading, setUploading] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function insertImage(fileName: string, url: string) {
		const alt = fileName.replace(/\.[^.]+$/, "") || "image";
		const markdown = `![${alt}](${url})`;
		const textarea = textareaRef.current;

		if (textarea) {
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const next = value.slice(0, start) + markdown + value.slice(end);
			onChange(next);

			requestAnimationFrame(() => {
				textarea.focus();
				textarea.selectionStart = start + markdown.length;
				textarea.selectionEnd = start + markdown.length;
			});
		} else {
			onChange(value ? `${value}\n\n${markdown}` : markdown);
		}

		setTab("write");
	}

	async function handleFile(file?: File) {
		if (!file) return;

		if (!acceptedTypes.includes(file.type)) {
			toast.error(
				"Unsupported file type. Please use a PNG, JPG, WebP, or GIF image.",
			);
			return;
		}

		if (file.size > maxImageSize) {
			toast.error("Image is too large. Maximum size is 5 MB.");
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("image", file);

			const res = await fetch(uploadUrl, {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to upload image",
				);
			}

			insertImage(file.name, result.url);
			toast.success("Image uploaded");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<Tabs
				value={tab}
				onValueChange={(next) => setTab(next as "write" | "preview")}
			>
				<div className="flex items-center justify-between gap-2 border-b bg-muted/10 pr-1.5">
					<TabsList className="m-1 h-7 bg-transparent">
						<TabsTrigger value="write" className="px-2.5 text-xs">
							Write
						</TabsTrigger>
						<TabsTrigger value="preview" className="px-2.5 text-xs">
							Preview
						</TabsTrigger>
					</TabsList>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-muted-foreground"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled || uploading}
					>
						{uploading ? <Spinner /> : <ImagePlus className="size-4" />}
						<span>{uploading ? "Uploading..." : "Attach image"}</span>
					</Button>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					className="hidden"
					onChange={(e) => handleFile(e.target.files?.[0])}
				/>

				<TabsContent value="write" className="m-0 p-0">
					<Textarea
						id={id}
						ref={textareaRef}
						rows={rows}
						className="h-[420px] resize-none rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
						placeholder={placeholder}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						disabled={disabled || uploading}
					/>
				</TabsContent>

				<TabsContent value="preview" className="m-0">
					<div className="max-h-[420px] min-h-[420px] overflow-auto px-4 py-3">
						{value.trim() ? (
							<Markdown content={value} />
						) : (
							<p className="text-sm italic text-muted-foreground">
								Nothing to preview.
							</p>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export { MarkdownEditor };
