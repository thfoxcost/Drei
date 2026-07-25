import { Separator } from "../ui/separator";
import RepoStarsheader from "./repo-stars-header";
import Rightpanel from "./right-panel";
import Tableheader from "./table-header";


function Repo() {
  return (
    <div className="flex flex-col px-10 h-full overflow-y-auto">
      <div className="">
        <RepoStarsheader reponame="Mom" />
        <Separator />
      </div>

      <div className="flex flex-row justify-between gap-8 mt-4">
        <div className="flex-1 min-w-0">
        <Tableheader defaultBranch="main" nBranches={4} nTags={6} cloneUrl="https://github.com/lofichr/lofichr" />
          
        </div>

        <div className="w-full max-w-xs shrink-0">
          <Rightpanel nCommits={128} nBranches={4} nTags={6} size={2450} />
        </div>
      </div>
    </div>
  );
}

export default Repo;