import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

function NewPrIndicator() {
  return (
    <div className="pb-4">
      <Item variant="outline" className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30">
        <ItemContent>
          <ItemTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="h-4 w-4" />
            New Pull Request
          </ItemTitle>
          <ItemDescription className="text-yellow-700 dark:text-yellow-400">
            A new pull request is waiting for your review.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            New Pull Request
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}

export default NewPrIndicator