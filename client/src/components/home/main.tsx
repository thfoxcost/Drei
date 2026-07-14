import Clock from "@/components/clock-06"
import Dash from "./dash"
import Profile from "./profile"

function Main() {
  return (
    <div className="flex min-h-screen gap-6 p-6">
      {/* Left Sidebar */}
      <Profile />

      {/* Main Content */}
      <div className="flex flex-1 gap-6">
        {/* Dashboard */}
        <div className="flex-1 min-w-0">
          <Dash />
        </div>

        {/* Clock */}
        <div className="shrink-0">
          <Clock />
        </div>
      </div>
    </div>
  )
}

export default Main