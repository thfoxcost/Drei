import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "@/components/ui/button";
import { StartsBtn } from "./stars-btn";
import { CloudBackup, Earth, Lock } from "lucide-react";
import { ForksBtn } from "./forks-btn";
import { Badge } from "../ui/badge";

interface RepoStarsheaderProps {
  reponame: string;
  visibility: boolean;
}

function RepoStarsheader({ reponame, visibility }: RepoStarsheaderProps) {
  const status = visibility ? "Public" : "Private";

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Avatar className="rounded-full after:rounded-[inherit]">
          <AvatarImage
            src="http://localhost:3000/lofichr.png"
            alt="avatar"
            className="rounded-full"
          />
          <AvatarFallback>AV</AvatarFallback>
        </Avatar>

        <p className="font-semibold text-foreground hover:underline">
          {reponame}
        </p>

        <Badge variant="secondary">
          {visibility ? (
            <Earth className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}

          {status}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <StartsBtn />
        <ForksBtn />

        <Button variant="outline">
          <CloudBackup />
          Backup
        </Button>
      </div>
    </div>
  );
}

export default RepoStarsheader;