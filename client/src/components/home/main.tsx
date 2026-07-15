import Clock from "@/components/clock-06"
import Dash from "./dash"
import Profile from "./profile"
import Weather from "./weather-07"
import SystemHealth from "./health"
import Repos from "./repos"

function Main() {
  return (
    <div className="flex min-h-screen gap-6 p-6 overflow-hidden">
      <Profile />

      <div className="flex flex-1 gap-6 min-w-0">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Dash />
          <Repos />
          {/* Add widget about salat */}
        </div>

        <div className="flex flex-col gap-6 shrink-0">
          <Clock />
          <Weather />
          <SystemHealth />
        </div>
      </div>
    </div>
  )
}

export default Main