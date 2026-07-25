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
  GitFork,
  StarIcon,
} from "lucide-react";

export function ForksBtn() {
  return (
    <ButtonGroup>
      <Button variant="outline">
        <GitFork  className="size-4" aria-hidden="true" />
        <span>Forks</span>
        <Badge variant="secondary">2.4k</Badge>
      </Button>

      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ChevronDownIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Toggle dropdown</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-40">
          <p className="text-xs text-muted-foreground">Forks coming soon</p>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}