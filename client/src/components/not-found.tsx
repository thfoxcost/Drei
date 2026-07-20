import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeIcon, CompassIcon } from "lucide-react";

export function NotFoundPage() {
	return (
		<div className="flex w-full items-center justify-center overflow-hidden">
			<div className="flex h-screen items-center border-x">
				<div>
					<FullWidthDivider />
					<Empty>
						<EmptyHeader>
							<EmptyTitle className="font-black font-mono text-8xl">
								404
							</EmptyTitle>
							<EmptyDescription className="text-nowrap">
								The page you're looking for might have been <br />
								moved or doesn't exist.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className="flex gap-2">
								<Button asChild>
									<a href="/home">
										<HomeIcon data-icon="inline-start" />
										Go Home
									</a>
								</Button>

								<Button asChild variant="outline">
									<a href="https://www.youtube.com/">
										<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>YouTube</title><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
										watch YouTube
									</a>
								</Button>
							</div>
						</EmptyContent>
					</Empty>
					<FullWidthDivider />
				</div>
			</div>
		</div>
	);
}
