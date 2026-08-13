import { Check, Code, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { timeAgo } from "#/lib/time-ago";

interface CommitCardProps {
	hash: string;
	message: string;
	author: string;
	date: string;
	avatar?: string | null;
}

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function CommitCard({ hash, message, author, date, avatar }: CommitCardProps) {
	const title = message.trim() || "No commit message";
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(hash);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// ignore clipboard failures
		}
	};

	return (
		<div className="group flex flex-row items-center gap-3 border-b p-3 transition-colors last:border-b-0 hover:bg-muted/50">
			<Avatar title={author}>
				{avatar ? <AvatarImage src={avatar} alt={author} /> : null}
				<AvatarFallback>{getInitials(author)}</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<p
					className="truncate text-base hover:cursor-pointer hover:underline font-semibold text-foreground"
					title={title}
				>
					{title}
				</p>

				<p className="mt-0.5 truncate text-xs text-muted-foreground">
					{author} committed {timeAgo(date)}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					className="h-auto px-1 font-mono text-xs text-muted-foreground"
					title={hash}
				>
					{hash.slice(0, 7)}
				</Button>

				<Button
					variant="ghost"
					size="icon-sm"
					className="text-muted-foreground"
					title={copied ? "Copied" : "Copy commit hash"}
					onClick={handleCopy}
				>
					{copied ? (
						<Check className="size-4 text-green-600" />
					) : (
						<CopyIcon className="size-4" />
					)}
				</Button>

				<Button
					variant="ghost"
					size="icon-sm"
					className="text-muted-foreground"
					title="View diff"
				>
					<Code className="size-4" />
				</Button>
			</div>
		</div>
	);
}

export default CommitCard;
