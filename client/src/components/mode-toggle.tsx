import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Pattern() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark"

    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    document.startViewTransition(() => {
      setTheme(nextTheme)
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
      aria-label="Toggle theme"
    >
      <SunIcon
        className={cn(
          "size-4 transition-all duration-300",
          isDark
            ? "scale-0 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        )}
      />

      <MoonIcon
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0"
        )}
      />
    </Button>
  )
}