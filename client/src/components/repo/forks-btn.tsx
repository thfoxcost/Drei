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
} from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";

export function ForksBtn({ disabled = false }: { disabled?: boolean }) {
  const navigate = useNavigate();
  const { username, repo } = useParams({ strict: false });

  return (
    <ButtonGroup>
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => navigate({ to: `/${username}/${repo}/forks` })}
      >
        <GitFork  className="size-4" aria-hidden="true" />
        <span>Forks</span>
        <Badge variant="secondary">2.4k</Badge>
      </Button>
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" disabled={disabled}>
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