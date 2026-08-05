import { Badge } from "@/components/reui/badge";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDownIcon,
  StarIcon,
} from "lucide-react";

export function StartsBtn() {
  return (
    <ButtonGroup>
      <Button variant="secondary" >
        <StarIcon className="size-4" aria-hidden="true" />
        <span>Star</span>
        <Badge variant="secondary">2.4k</Badge>
      </Button>

      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" >
            <ChevronDownIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Toggle dropdown</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-40">
          <p className="text-xs text-muted-foreground">Save repo coming soon</p>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}