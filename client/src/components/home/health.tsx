import {
  CircleIcon,
  DatabaseIcon,
  GlobeIcon,
  HardDriveIcon,
  ServerIcon,
} from "lucide-react";
import { Fragment } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
import {
  Widget,
  WidgetContent,
  WidgetFooter,
} from "#/components/ui/widget.tsx";
import { type ServiceState, useHealth } from "#/hooks/use-health.ts";

const STATUS_COLOR: Record<ServiceState, string> = {
  online: "text-green-500",
  degraded: "text-yellow-500",
  offline: "text-red-500",
  unavailable: "text-muted-foreground",
};

const STATUS_LABEL: Record<ServiceState, string> = {
  online: "Operational",
  degraded: "Checking",
  offline: "Offline",
  unavailable: "Unavailable",
};

const SERVICE_ICONS: Record<string, typeof ServerIcon> = {
  frontend: GlobeIcon,
  backend: ServerIcon,
  database: DatabaseIcon,
  db: DatabaseIcon,
  storage: HardDriveIcon,
};

// Order here also defines the display order of the rows below.
const VISIBLE_SERVICES = [
  "frontend",
  "backend",
  "database",
  "storage",
] as const;

const BYTES_PER_GB = 1024 ** 3;
const BYTES_PER_MB = 1024 ** 2;

// Storage is always shown in gigabytes, with the mebibyte value in the tooltip.
function formatGB(bytes: number): string {
  return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
}

function formatMB(bytes: number): string {
  return `${Math.round(bytes / BYTES_PER_MB).toLocaleString()} MB`;
}

function getServiceIcon(name: string) {
  return SERVICE_ICONS[name.toLowerCase()] ?? ServerIcon;
}

function Metric({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <Fragment>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-right tabular-nums" title={title}>
        {value}
      </span>
    </Fragment>
  );
}

function Message({ children }: { children: string }) {
  return (
    <Widget design="mumbai">
      <WidgetContent className="h-32 items-center justify-center">
        <span className="text-center text-sm text-muted-foreground">
          {children}
        </span>
      </WidgetContent>
    </Widget>
  );
}

export default function SystemHealth() {
  const { data: health, isPending, sessionPending } = useHealth();

  // isPending stays true while the query is disabled, so the session flag is
  // what separates "still resolving the session" from "signed out".
  if (isPending && sessionPending) {
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

  if (!health) {
    return <Message>Sign in to view system health.</Message>;
  }

  const { services, system, client, storage } = health;

  const serviceByName = new Map(
    services.map((service) => [service.name.toLowerCase(), service]),
  );

  // Every expected service keeps a row even when the backend omits it, so a
  // missing entry reads as unavailable instead of silently disappearing.
  const visibleServices = VISIBLE_SERVICES.map((key) => {
    const service = serviceByName.get(key);

    return {
      key,
      name: service?.name ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
      status: service?.status ?? "unavailable",
    };
  });

  return (
    <Widget design="mumbai" className="h-auto gap-4">
      <WidgetContent className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-3">
        {visibleServices.map((service) => {
          const Icon = getServiceIcon(service.name);

          return (
            <Fragment key={service.key}>
              <Icon className="size-4 text-muted-foreground" />

              <span className="text-sm font-medium capitalize">
                {service.name}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex justify-end">
                    <CircleIcon
                      className={`size-2.5 fill-current ${STATUS_COLOR[service.status]}`}
                      aria-label={STATUS_LABEL[service.status]}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{STATUS_LABEL[service.status]}</TooltipContent>
              </Tooltip>
            </Fragment>
          );
        })}
      </WidgetContent>

      <WidgetFooter>
        {system ? (
          <div className="grid grid-cols-[auto_1fr] gap-x-12 gap-y-2 text-sm">
            <Metric
              label="CPU"
              value={`${system.cpu.percent.toFixed(1)}%`}
              title={`${system.cpu.count} logical cores`}
            />

            <Metric
              label="Client"
              value={client ? formatGB(client.rssBytes) : "—"}
              title={
                client
                  ? `Resident set size · heap ${formatMB(client.heapUsedBytes)} of ${formatMB(client.heapTotalBytes)}`
                  : undefined
              }
            />

            <Metric
              label="Process"
              value={`${system.processMemory.rss} ${system.processMemory.unit}`}
              title={`Resident set size · heap ${system.processMemory.heap} ${system.processMemory.unit} · ${system.processMemory.goroutines} goroutines`}
            />

            <Metric
              label="Storage"
              value={storage ? formatGB(storage.bytes) : "—"}
              title={storage ? formatMB(storage.bytes) : undefined}
            />

            <Metric
              label="Uptime"
              value={system.uptime}
              title={`Backend ${system.version} · ${system.environment} · host up ${system.hostUptime}`}
            />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            System metrics are only available to signed-in users.
          </span>
        )}
      </WidgetFooter>
    </Widget>
  );
}
