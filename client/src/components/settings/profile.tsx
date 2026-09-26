import { authClient } from "#/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

function ProfileHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const displayName = user?.name ?? "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-row gap-3 items-center  mb-5">
      <Avatar className="size-9">
        <AvatarImage src={user?.image ?? undefined} />
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col justify-start gap-0">
        <span className="font-semibold">
          {displayName}{" "}
          <span className="text-muted-foreground">({user?.email ?? ""})</span>
        </span>
        <span className="text-muted-foreground text-xs">
          Your personal account
        </span>
      </div>
    </div>
  );
}

export default ProfileHeader;
