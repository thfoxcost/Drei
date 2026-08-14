import type { ReactNode } from "react";

import Profile from "#/components/home/profile";
import { authClient } from "#/lib/auth-client";

interface DashboardLayoutProps {
	children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
	const { data: session } = authClient.useSession();

	const username = session?.user.name;

	return (
		<div className="flex flex-1 min-h-0 gap-6 p-6 overflow-hidden">
			<div className="flex flex-col gap-4">
				<Profile />
				<div className="flex h-26 w-auto items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
					@{username ?? "username"}
				</div>
			</div>

			<div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0 overflow-y-auto mx-10">
				{children}
			</div>
		</div>
	);
}

export default DashboardLayout;
