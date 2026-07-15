import { Fragment } from "react";
import {
  CircleIcon,
  DatabaseIcon,
  HardDriveIcon,
  ServerIcon,
  GlobeIcon,
} from "lucide-react";

import { useHealth, type ServiceState } from "#/hooks/use-health.ts";
import {
  Widget,
  WidgetContent,
  WidgetFooter,
  WidgetHeader,
  WidgetTitle,
} from "#/components/ui/widget.tsx";

const STATUS_COLOR: Record<ServiceState, string> = {
  online: "text-green-500",
  degraded: "text-yellow-500",
  offline: "text-red-500",
};

const STATUS_LABEL: Record<ServiceState, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
};

const SERVICE_ICONS: Record<string, typeof ServerIcon> = {
  frontend: GlobeIcon,
  backend: ServerIcon,
  database: DatabaseIcon,
  db: DatabaseIcon,
  storage: HardDriveIcon,
};

// Order here also defines the display order of the rows below.
const VISIBLE_SERVICES = ["frontend", "backend", "database", "storage"] as const;

function getServiceIcon(name: string) {
  return SERVICE_ICONS[name.toLowerCase()] ?? ServerIcon;
}

export default function SystemHealth() {
  const { data: health, isLoading } = useHealth();

  if (isLoading || !health) {
    return (
      <Widget design="mumbai">
        <WidgetContent className="flex h-48 items-center justify-center">
          <span className="text-muted-foreground animate-pulse">
            Loading...
          </span>
        </WidgetContent>
      </Widget>
    );
  }

  const { services, system } = health;

  const serviceByName = new Map(
    services.map((service) => [service.name.toLowerCase(), service]),
  );

  const visibleServices = VISIBLE_SERVICES.map((name) =>
    serviceByName.get(name),
  ).filter((service): service is NonNullable<typeof service> => !!service);

  return (
    <Widget design="mumbai" className="h-auto gap-4">
      <WidgetHeader>
        <WidgetTitle>System Health</WidgetTitle>
      </WidgetHeader>

      <WidgetContent className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
        {visibleServices.map((service) => {
          const Icon = getServiceIcon(service.name);

          return (
            <Fragment key={service.name}>
              <Icon className="size-4 text-muted-foreground" />

              <span className="text-sm font-medium capitalize">
                {service.name}
              </span>

              <span className="flex justify-end" title={STATUS_LABEL[service.status]}>
                <CircleIcon
                  className={`size-2.5 fill-current ${STATUS_COLOR[service.status]}`}
                  aria-label={STATUS_LABEL[service.status]}
                />
              </span>
            </Fragment>
          );
        })}
      </WidgetContent>

      <WidgetFooter className="border-t pt-4">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <span className="text-muted-foreground">CPU</span>
          <span className="text-right tabular-nums">{system.cpu}%</span>

          <span className="text-muted-foreground">RAM</span>
          <span className="text-right tabular-nums">
            {system.memory.used} / {system.memory.total} {system.memory.unit}
          </span>

          <span className="text-muted-foreground">Disk</span>
          <span className="text-right tabular-nums">
            {system.disk.used}
            {system.disk.unit}
          </span>

          <span className="text-muted-foreground">Uptime</span>
          <span className="text-right tabular-nums">{system.uptime}</span>
        </div>
      </WidgetFooter>
    </Widget>
  );
}