import { memoryUsage } from "node:process";
import { createFileRoute } from "@tanstack/react-router";

// Reports this server process's own memory usage.
//
// The Go backend cannot read another process's memory, so the client has to
// publish its own figures for the system health snapshot to pick up.
export const Route = createFileRoute("/api/memory")({
	server: {
		handlers: {
			GET: async () => {
				const usage = memoryUsage();

				return Response.json(
					{
						rssBytes: usage.rss,
						heapUsedBytes: usage.heapUsed,
						heapTotalBytes: usage.heapTotal,
					},
					{ headers: { "Cache-Control": "no-store" } },
				);
			},
		},
	},
});
