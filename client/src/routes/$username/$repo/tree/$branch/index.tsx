import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/$username/$repo/tree/$branch/")({
  loader: ({ params }) => {
    throw redirect({
      to: "/$username/$repo",
      params: { username: params.username, repo: params.repo },
    })
  },
})
