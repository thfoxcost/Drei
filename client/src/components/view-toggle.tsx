"use client";

import { BookMarkedIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { ButtonGroup } from "#/components/ui/button-group";
import { cn } from "#/lib/utils.ts";

export type PeopleView = "users" | "repos";

const views: {
  id: PeopleView;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
    {
      id: "users",
      labelKey: "common.views.users",
      icon: <UsersIcon aria-hidden="true" className="size-3.5" />,
    },
    {
      id: "repos",
      labelKey: "common.views.repos",
      icon: <BookMarkedIcon aria-hidden="true" className="size-3.5" />,
    },
  ];

interface ViewToggleProps {
  value?: PeopleView;
  defaultValue?: PeopleView;
  onValueChange?: (value: PeopleView) => void;
}

export function ViewToggle({
  value,
  defaultValue = "users",
  onValueChange,
}: ViewToggleProps) {
  const { t } = useTranslation();
  const [internal, setInternal] = useState<PeopleView>(defaultValue);
  const active = value ?? internal;

  function select(next: PeopleView) {
    if (value === undefined) {
      setInternal(next);
    }
    onValueChange?.(next);
  }

  return (
    <ButtonGroup>
      {views.map((view) => (
        <Button
          key={view.id}
          type="button"
          variant="outline"
          className={cn(
            "gap-2 font-medium [&_svg]:opacity-60",
            active === view.id
              ? "border-foreground bg-foreground! text-background shadow-sm hover:bg-foreground hover:text-background [&_svg]:opacity-100"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => select(view.id)}
          aria-pressed={active === view.id}
        >
          {view.icon}
          {t(view.labelKey)}
        </Button>
      ))}
    </ButtonGroup>
  );
}
