import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

/**
 * Development-only overlay.
 *
 * This module is reached exclusively through a dynamic import guarded by
 * `import.meta.env.DEV` in the root route, so it is not part of the production
 * module graph. A static import here would be enough to ship the devtools
 * runtime to every user.
 */
export function Devtools() {
	return (
		<TanStackDevtools
			config={{
				position: "top-right",
			}}
			plugins={[
				{
					name: "Tanstack Router",
					render: <TanStackRouterDevtoolsPanel />,
				},
			]}
		/>
	);
}
