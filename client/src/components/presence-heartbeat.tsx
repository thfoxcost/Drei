"use client";

import { useEffect } from "react";
import { authClient } from "#/lib/auth-client";

const HEARTBEAT_MS = 60_000;

async function beat(keepalive = false) {
	try {
		await fetch("http://localhost:3200/api/presence/heartbeat", {
			method: "POST",
			credentials: "include",
			keepalive,
		});
	} catch {
		// Presence is best-effort; never surface errors to the user.
	}
}

/**
 * Refreshes the signed-in user's online heartbeat about once a minute while
 * a tab is visible. Mounted once in the root shell so every page counts as
 * presence. Hidden tabs pause; a final beat fires on page hide.
 */
export function PresenceHeartbeat() {
	const { data: session, isPending } = authClient.useSession();
	const userId = session?.user?.id;

	useEffect(() => {
		if (isPending || !userId || typeof document === "undefined") return;

		if (document.visibilityState === "visible") {
			void beat();
		}

		const id = window.setInterval(() => {
			if (document.visibilityState === "visible") {
				void beat();
			}
		}, HEARTBEAT_MS);

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void beat();
			}
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		const onPageHide = () => {
			void beat(true);
		};
		window.addEventListener("pagehide", onPageHide);

		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("pagehide", onPageHide);
		};
	}, [isPending, userId]);

	return null;
}
