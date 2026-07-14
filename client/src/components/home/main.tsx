import Dash from "./dash"
import Profile from "./profile"

function Main() {
  return (
    <div className="flex gap-6 p-6">
      <Profile />

      <div className="flex">
        <Dash />
      </div>
    </div>
  )
}

export default Main