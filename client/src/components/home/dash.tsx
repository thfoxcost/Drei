import { Suspense } from "react"

import {
  GitHubContributions,
  GitHubContributionsFallback,
} from "@/components/github-contributions"

import { getContributions } from "@/lib/get-cached-contributions"

const PROFILE_URL = "/profile"

function Dash() {
  const contributions = getContributions()

  return (
    <div className="w-full">
      <Suspense fallback={<GitHubContributionsFallback />}>
        <GitHubContributions
          contributions={contributions}
          githubProfileUrl={PROFILE_URL}
        />
      </Suspense>
    </div>
  )
}

export default Dash