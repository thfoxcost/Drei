import Codeblock from "./code-block"
import Filetree from "./filetree"
import Latestcommitsbox from "./latestcommitsbox"

function Code() {
  return (
    <div className="flex items-start">
      <aside className="sticky top-0 h-screen shrink-0">
        <Filetree />
      </aside>

      <main className="min-w-0 flex-2 mx-5 flex flex-col gap-3">
        <span className="font-semibold">
          <span className="text-blue-400 hover:underline cursor-pointer">Drei</span>{" "}
          <span className="text-muted-foreground">/</span>{" "}
          <span className="text-blue-400 hover:underline cursor-pointer">backend</span>{" "}
          <span className="text-muted-foreground">/</span>{" "}
          <span className="font-medium">.env.example</span>
        </span>
        <Latestcommitsbox />
        <Codeblock />
      </main>
    </div>
  )
}

export default Code