import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/')({
  component: RouteComponent,
})


// make req to GET /api/repos/:owner/:repo and get as res if the repo has been pused to it as bool
// render <Norepo /> first when redirect to the repo page as first
// add comparison if :
  // 1. repo is empty => <Norepo /> (default)
  // 2. repo is not empty => <Repo /> [make go apis]


function RouteComponent() {
  return <div>



  </div>
}
