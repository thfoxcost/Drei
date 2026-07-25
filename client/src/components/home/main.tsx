import Clock from "@/components/clock-06"
import Dash from "./dash"
import Profile from "./profile"
import Weather from "./weather-07"
import SystemHealth from "./health"
import Repos from "./repos"
import { authClient } from "#/lib/auth-client"

function Main() {
  const { data: session } = authClient.useSession()
  return (
    <div className="flex min-h-screen gap-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-4">

        <Profile />
        <div className="flex h-26 w-auto items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          @{session?.user.name ?? "username"}
        </div>
      </div>
      <div className="flex flex-1 gap-6 min-w-0">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Dash />
          <Repos />
          {/* Add widget about salat */}
        </div>

        <div className="flex flex-col gap-8.5 shrink-0">
          <Clock />
          <Weather />
          <SystemHealth />
        </div>
      </div>
    </div>
  )
}

export default Main