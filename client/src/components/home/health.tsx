import {
	CircleIcon,
	DatabaseIcon,
	GlobeIcon,
	HardDriveIcon,
	ServerIcon,
} from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
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
import { formatNumber } from "#/i18n/lib/format";

const STATUS_COLOR: Record<ServiceState, string> = {
	online: "text-green-500",
	degraded: "text-yellow-500",
	offline: "text-red-500",
	unavailable: "text-muted-foreground",
};

const STATUS_LABEL_KEY: Record<ServiceState, string> = {
	online: "dashboard.health.status.operational",
	degraded: "dashboard.health.status.checking",
	offline: "dashboard.health.status.offline",
	unavailable: "dashboard.health.status.unavailable",
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
	return `${formatNumber(Number((bytes / BYTES_PER_GB).toFixed(2)))} GB`;
}

function formatMB(bytes: number): string {
	return `${formatNumber(Math.round(bytes / BYTES_PER_MB))} MB`;
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
	const { t } = useTranslation();
	const { data: health, isPending, isError } = useHealth();

	if (isPending) {
		return (
			<Widget design="mumbai">
				<WidgetContent className="flex h-48 items-center justify-center">
					<span className="text-muted-foreground animate-pulse">
						{t("dashboard.health.loading")}
					</span>
				</WidgetContent>
			</Widget>
		);
	}

	if (isError || !health) {
		return <Message>{t("dashboard.health.loadFailed")}</Message>;
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
			name: service?.name ?? t(`dashboard.health.${key}`),
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
											aria-label={t(STATUS_LABEL_KEY[service.status])}
										/>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{t(STATUS_LABEL_KEY[service.status])}
								</TooltipContent>
							</Tooltip>
						</Fragment>
					);
				})}
			</WidgetContent>

			<WidgetFooter>
				{system ? (
					<div className="grid grid-cols-[auto_1fr] gap-x-12 gap-y-2 text-sm">
						<Metric
							label={t("dashboard.health.metrics.cpu")}
							value={`${system.cpu.percent.toFixed(1)}%`}
							title={t("common.units.logicalCores", {
								count: system.cpu.count,
							})}
						/>

						<Metric
							label={t("dashboard.health.metrics.client")}
							value={client ? formatGB(client.rssBytes) : "—"}
							title={
								client
									? `Resident set size · heap ${formatMB(client.heapUsedBytes)} of ${formatMB(client.heapTotalBytes)}`
									: undefined
							}
						/>

						<Metric
							label={t("dashboard.health.metrics.process")}
							value={`${system.processMemory.rss} ${system.processMemory.unit}`}
							title={t("dashboard.health.processDetail", {
								heap: system.processMemory.heap,
								unit: system.processMemory.unit,
								goroutines: system.processMemory.goroutines,
							})}
						/>

						<Metric
							label={t("dashboard.health.metrics.storage")}
							value={storage ? formatGB(storage.bytes) : "—"}
							title={storage ? formatMB(storage.bytes) : undefined}
						/>

						<Metric
							label={t("dashboard.health.metrics.uptime")}
							value={system.uptime}
							title={t("dashboard.health.uptimeDetail", {
								version: system.version,
								environment: system.environment,
								uptime: system.hostUptime,
							})}
						/>
					</div>
				) : (
					<span className="text-sm text-muted-foreground">
						{t("dashboard.health.signedInOnly")}
					</span>
				)}
			</WidgetFooter>
		</Widget>
	);
}
