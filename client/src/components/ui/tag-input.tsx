import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
	tags: string[];
	setTags: (tags: string[]) => void;
	id?: string;
	placeholder?: string;
	className?: string;
}

function TagInput({
	tags,
	setTags,
	id,
	placeholder = "Add a tag",
	className,
}: TagInputProps) {
	const [inputValue, setInputValue] = useState("");

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const newTag = inputValue.trim().toLowerCase();
			if (newTag && !tags.includes(newTag)) {
				setTags([...tags, newTag]);
			}
			setInputValue("");
		}
		if (e.key === "Backspace" && !inputValue && tags.length > 0) {
			setTags(tags.slice(0, -1));
		}
	}

	function removeTag(tag: string) {
		setTags(tags.filter((t) => t !== tag));
	}

	return (
		<div
			className={cn(
				"flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30",
				className,
			)}
		>
			{tags.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
				>
					{tag}
					<button
						type="button"
						className="rounded-full p-0.5 hover:bg-muted-foreground/20"
						onClick={() => removeTag(tag)}
					>
						<X className="size-3" />
					</button>
				</span>
			))}
			<input
				id={id}
				type="text"
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={tags.length === 0 ? placeholder : ""}
				className="min-w-[120px] flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}

export { TagInput };
