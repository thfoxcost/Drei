import { useQuery } from "@tanstack/react-query"
import type { RepoData } from "#/types/repo"

export function useRepoData(owner: string, repo: string) {
  return useQuery({
    queryKey: ["repo", owner, repo],
    queryFn: async (): Promise<RepoData> => {
      const res = await fetch(`http://localhost:3200/api/repos/${owner}/${repo}`)
      if (!res.ok) throw new Error("Failed to fetch repository")
      return res.json()
    },
    staleTime: 60_000,
  })
}