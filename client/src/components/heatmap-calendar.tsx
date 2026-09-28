"use client";

// Vendored from fishdev20/shadcn-heatmap (MIT © Minh (Marcus) Nguyen),
// adapted to Drei import aliases (`#/*` → `src/*`).
// A GitHub-style heatmap calendar built with React, Tailwind CSS and shadcn/ui.

import * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
import { cn } from "#/lib/utils.ts";

export type HeatmapDatum = {
	date: string | Date;
	value: number;
	meta?: unknown;
};

export type HeatmapCell = {
	date: Date;
	key: string;
	value: number;
	level: number;
	label: string;
	disabled: boolean;
	/** True for dates after today (no data can exist yet). */
	future: boolean;
	meta?: unknown;
};

export type LegendConfig = {
	show?: boolean;
	/** Default: "Less" */
	lessText?: React.ReactNode;
	/** Default: "More" */
	moreText?: React.ReactNode;
	/** Default: true (shows the arrow) */
	showArrow?: boolean;
	/** Default: "right" */
	placement?: "right" | "bottom";
	/** Default: "row" */
	direction?: "row" | "column";
	/** Default: true */
	showText?: boolean;
	/** Default: uses cellSize */
	swatchSize?: number;
	/** Default: uses cellGap */
	swatchGap?: number;
	className?: string;
};

export type AxisLabelsConfig = {
	/** Default: true */
	show?: boolean;
	/** Show weekday labels on left. Default: true */
	showWeekdays?: boolean;
	/** Show month labels on top. Default: true */
	showMonths?: boolean;
	/**
	 * Which weekday rows to label (0..6 in grid order top->bottom).
	 * Default: [1,3,5] => Mon/Wed/Fri when weekStartsOn=1 (nice uncluttered)
	 */
	weekdayIndices?: number[];
	/** Month label format. Default: "short" */
	monthFormat?: "short" | "long" | "numeric";
	/**
	 * Minimum spacing in weeks between month labels to avoid crowding.
	 * Default: 3
	 */
	minWeekSpacing?: number;
	className?: string;
};

export type HeatmapCalendarProps = {
	data: HeatmapDatum[];
	/** Number of days ending at endDate (default 365). Ignored when year mode is active. */
	rangeDays?: number;
	endDate?: Date;
	weekStartsOn?: 0 | 1;

	/**
	 * Show a full calendar year (Jan 1 - Dec 31) instead of a rolling `rangeDays`
	 * window. Passing `year` puts the component in controlled mode; use
	 * `defaultYear` for an uncontrolled initial year.
	 */
	year?: number;
	/** Uncontrolled initial year. Implies year mode. */
	defaultYear?: number;

	/** Cell size in px (default 12) */
	cellSize?: number;
	/** Gap between cells in px (default 3) */
	cellGap?: number;

	/** Called when a cell is clicked */
	onCellClick?: (cell: HeatmapCell) => void;

	/** Tailwind class names for levels 0..N (used when palette is not provided) */
	levelClassNames?: string[];

	/**
	 * How raw values map to intensity levels.
	 * - "fixed": use `thresholds` (or the built-in [2, 5, 10]) as absolute cutoffs.
	 * - "quantile": derive cutoffs from the distribution of values actually present
	 *   in `data`, so any unit fills the palette instead of clustering.
	 * Default: "fixed"
	 */
	scale?: "fixed" | "quantile";

	/** Absolute cutoffs used when `scale` is "fixed". Default: [0, 1, 2, 3, 5] */
	thresholds?: number[];

	/** Full custom control over value -> level mapping (overrides `scale`/`thresholds`) */
	getLevel?: (value: number) => number;

	/**
	 * Direct color palette for levels 0..N.
	 * If provided, it overrides levelClassNames for cell and legend coloring.
	 */
	palette?: string[];

	/** Configure legend, or set to false to hide */
	legend?: boolean | LegendConfig;

	/** Add axis labels (weekday + month) */
	axisLabels?: boolean | AxisLabelsConfig;

	/** Full custom legend render (overrides legend config UI) */
	renderLegend?: (args: {
		levelCount: number;
		levelClassNames: string[];
		palette?: string[];
		cellSize: number;
		cellGap: number;
	}) => React.ReactNode;

	/** Tooltip content override */
	renderTooltip?: (cell: HeatmapCell) => React.ReactNode;

	className?: string;
};

/* ---------------- utilities ---------------- */

function startOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function addDays(d: Date, days: number) {
	const x = new Date(d);
	x.setDate(x.getDate() + days);
	return x;
}

function toKey(d: Date) {
	// Local calendar day (YYYY-MM-DD). The grid is built from local-midnight
	// dates, so keys must be local too — toISOString() is UTC and shifts every
	// cell by a day for timezones east of Greenwich.
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function parseDatumDate(value: string | Date): Date {
	if (value instanceof Date) return value;
	// A bare "YYYY-MM-DD" is a calendar day, not a UTC instant: constructing it
	// directly would shift it for timezones west of Greenwich. Build it as a
	// local date so it keys to the day the backend reported.
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return new Date(value);
}

function startOfWeek(d: Date, weekStartsOn: 0 | 1) {
	const x = startOfDay(d);
	const day = x.getDay();
	const diff = (day - weekStartsOn + 7) % 7;
	x.setDate(x.getDate() - diff);
	return x;
}

/** Default GitHub-ish buckets: level = number of thresholds cleared. */
function levelFromThresholds(value: number, thresholds: number[]) {
	if (value <= 0) return 0;
	let level = 0;
	for (const t of thresholds) {
		if (value > t) level++;
	}
	return level;
}

/**
 * Splits the positive values present in `data` into `levelCount - 1` quantile
 * buckets, so the palette is used proportionally regardless of unit/scale.
 */
function quantileThresholds(values: number[], levelCount: number) {
	const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
	const bucketCount = Math.max(1, levelCount - 1);
	if (positive.length === 0) return [] as number[];

	const thresholds: number[] = [];
	for (let i = 1; i < bucketCount; i++) {
		const idx = Math.min(
			positive.length - 1,
			Math.floor((positive.length * i) / bucketCount) - 1,
		);
		thresholds.push(positive[Math.max(0, idx)]);
	}
	return thresholds;
}

function clampLevel(level: number, levelCount: number) {
	return Math.max(0, Math.min(levelCount - 1, level));
}

function bgStyleForLevel(level: number, palette?: string[]) {
	if (!palette?.length) return undefined;
	const idx = clampLevel(level, palette.length);
	return { backgroundColor: palette[idx] };
}

function sameMonth(a: Date, b: Date) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonth(d: Date, fmt: "short" | "long" | "numeric") {
	if (fmt === "numeric") {
		const yy = String(d.getFullYear()).slice(-2);
		return `${d.getMonth() + 1}/${yy}`;
	}
	return d.toLocaleDateString(undefined, { month: fmt });
}

function weekdayLabelForIndex(index: number, weekStartsOn: 0 | 1) {
	// index is 0..6 in grid row order (top->bottom).
	const actualDay = (weekStartsOn + index) % 7;
	const base = new Date(Date.UTC(2024, 0, 7 + actualDay));
	return base.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
}

/* ---------------- component ---------------- */

export function HeatmapCalendar({
	data,
	rangeDays = 365,
	endDate = new Date(),
	weekStartsOn = 1,
	year,
	defaultYear,
	cellSize = 12,
	cellGap = 3,
	onCellClick,
	levelClassNames,
	palette,
	scale = "fixed",
	thresholds,
	getLevel: getLevelProp,
	legend = true,
	axisLabels = true,
	renderLegend,
	renderTooltip,
	className,
}: HeatmapCalendarProps) {
	// Default classes are semantic => good in light/dark
	const levels = levelClassNames ?? [
		"bg-muted",
		"bg-primary/25",
		"bg-primary/45",
		"bg-primary/65",
		"bg-primary/85",
		"bg-primary",
	];

	const levelCount = palette?.length ? palette.length : levels.length;

	const legendCfg: LegendConfig =
		legend === true ? {} : legend === false ? { show: false } : legend;

	const axisCfg: AxisLabelsConfig =
		axisLabels === true
			? {}
			: axisLabels === false
				? { show: false }
				: axisLabels;

	const showAxis = axisCfg.show ?? true;
	const showWeekdays = axisCfg.showWeekdays ?? true;
	const showMonths = axisCfg.showMonths ?? true;
	const weekdayIndices = axisCfg.weekdayIndices ?? [1, 3, 5];
	const monthFormat = axisCfg.monthFormat ?? "short";
	const minWeekSpacing = axisCfg.minWeekSpacing ?? 3;

	const today = startOfDay(new Date());

	const yearModeActive = year !== undefined || defaultYear !== undefined;
	const isYearControlled = year !== undefined;
	const [uncontrolledYear] = React.useState(
		() => defaultYear ?? year ?? today.getFullYear(),
	);
	const currentYear = isYearControlled ? year : uncontrolledYear;

	const end = yearModeActive
		? startOfDay(new Date(currentYear, 11, 31))
		: startOfDay(endDate);
	const start = yearModeActive
		? startOfDay(new Date(currentYear, 0, 1))
		: addDays(end, -(rangeDays - 1));

	const valueMap = React.useMemo(() => {
		const map = new Map<string, { value: number; meta?: unknown }>();
		for (const item of data) {
			const d = parseDatumDate(item.date);
			const key = toKey(d);

			const prev = map.get(key);
			const nextVal = (prev?.value ?? 0) + (item.value ?? 0); // sum merge
			map.set(key, { value: nextVal, meta: item.meta ?? prev?.meta });
		}
		return map;
	}, [data]);

	const resolvedThresholds = React.useMemo(() => {
		if (scale === "quantile") {
			const values = Array.from(valueMap.values(), (v) => v.value);
			return quantileThresholds(values, levelCount);
		}
		// Five cutoffs => six levels, tuned for low daily rates so even a
		// single contribution reads clearly above empty.
		return thresholds ?? [0, 1, 2, 3, 5];
	}, [scale, thresholds, valueMap, levelCount]);

	const getLevel = React.useCallback(
		(value: number) =>
			getLevelProp?.(value) ?? levelFromThresholds(value, resolvedThresholds),
		[getLevelProp, resolvedThresholds],
	);

	const firstWeek = startOfWeek(start, weekStartsOn);
	const totalDays =
		Math.ceil((end.getTime() - firstWeek.getTime()) / 86400000) + 1;
	const weeks = Math.ceil(totalDays / 7);

	const cells: HeatmapCell[] = React.useMemo(() => {
		const list: HeatmapCell[] = [];
		for (let w = 0; w < weeks; w++) {
			for (let d = 0; d < 7; d++) {
				const date = addDays(firstWeek, w * 7 + d);
				const inRange = date >= start && date <= end;
				const isFuture = date > today;
				const key = toKey(date);

				const v = inRange ? (valueMap.get(key)?.value ?? 0) : 0;
				const meta = inRange ? valueMap.get(key)?.meta : undefined;
				const lvl = inRange && !isFuture ? getLevel(v) : 0;

				list.push({
					date,
					key,
					value: v,
					level: clampLevel(lvl, levelCount),
					disabled: !inRange,
					future: inRange && isFuture,
					meta,
					label: date.toLocaleDateString(undefined, {
						year: "numeric",
						month: "short",
						day: "numeric",
					}),
				});
			}
		}
		return list;
	}, [weeks, firstWeek, start, end, today, valueMap, getLevel, levelCount]);

	const columns: HeatmapCell[][] = React.useMemo(() => {
		const cols: HeatmapCell[][] = [];
		for (let i = 0; i < weeks; i++) {
			cols.push(cells.slice(i * 7, i * 7 + 7));
		}
		return cols;
	}, [cells, weeks]);

	const monthLabels = React.useMemo(() => {
		if (!showAxis || !showMonths)
			return [] as { colIndex: number; text: string }[];

		const labels: { colIndex: number; text: string }[] = [];
		let lastLabeledWeek = -999;

		for (let i = 0; i < columns.length; i++) {
			const col = columns[i];
			const firstInCol = col.find((c) => !c.disabled)?.date ?? col[0].date;

			const prevCol = i > 0 ? columns[i - 1] : null;
			const prevFirst =
				prevCol?.find((c) => !c.disabled)?.date ?? prevCol?.[0]?.date;

			const monthChanged = !prevFirst || !sameMonth(firstInCol, prevFirst);

			if (monthChanged && i - lastLabeledWeek >= minWeekSpacing) {
				labels.push({
					colIndex: i,
					text: formatMonth(firstInCol, monthFormat),
				});
				lastLabeledWeek = i;
			}
		}

		return labels;
	}, [columns, showAxis, showMonths, monthFormat, minWeekSpacing]);

	/* ---------------- fluid sizing ---------------- */

	// Full-width grid: measure the scroll container and grow the cells so the
	// year fills the available width. Never shrinks below `cellSize`, so narrow
	// screens keep scrolling instead of crushing the cells.
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = React.useState(0);

	React.useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const update = () => setContainerWidth(el.clientWidth);
		update();
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const legendOnSide =
		(legendCfg.show ?? true) && (legendCfg.placement ?? "right") === "right";
	const labelReserve = showAxis && showWeekdays ? 48 : 0;
	const gridAvailable =
		containerWidth - labelReserve - (legendOnSide ? 160 : 0);
	const s =
		gridAvailable > 0
			? Math.max(
					cellSize,
					Math.floor((gridAvailable + cellGap) / weeks) - cellGap,
				)
			: cellSize;

	/* ---------------- legend ---------------- */

	const showLegend = legendCfg.show ?? true;
	const placement = legendCfg.placement ?? "right";
	const direction = legendCfg.direction ?? "row";
	const showText = legendCfg.showText ?? true;
	const showArrow = legendCfg.showArrow ?? true;
	const lessText = legendCfg.lessText ?? "Less";
	const moreText = legendCfg.moreText ?? "More";
	const swatchSize = legendCfg.swatchSize ?? s;
	const swatchGap = legendCfg.swatchGap ?? cellGap;

	const LegendUI = renderLegend ? (
		renderLegend({
			levelCount,
			levelClassNames: levels,
			palette,
			cellSize: s,
			cellGap,
		})
	) : !showLegend ? null : (
		<div className={cn("min-w-35 shrink-0", legendCfg.className)}>
			{showText ? (
				<div className="mb-2 text-xs text-muted-foreground">
					{lessText} {showArrow ? <span aria-hidden>→</span> : null} {moreText}
				</div>
			) : null}

			<div
				className={cn(
					"flex items-center",
					direction === "row" ? "flex-row" : "flex-col",
				)}
				style={{ gap: `${swatchGap}px` }}
			>
				{Array.from({ length: levelCount }).map((_, i) => {
					const cls = levels[clampLevel(i, levels.length)];
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: legend swatches are positionally stable
							key={i}
							className={cn("rounded-[3px]", !palette?.length && cls)}
							style={{
								width: swatchSize,
								height: swatchSize,
								...(bgStyleForLevel(i, palette) ?? {}),
							}}
							aria-hidden="true"
						/>
					);
				})}
			</div>
		</div>
	);

	/* ---------------- tooltip ---------------- */

	const tooltipNode = (cell: HeatmapCell) => {
		if (renderTooltip) return renderTooltip(cell);
		if (cell.disabled) return "Outside range";
		if (cell.future) return "Upcoming";
		const unit = cell.value === 1 ? "event" : "events";
		return (
			<div className="text-sm">
				<div className="font-medium">
					{cell.value} {unit}
				</div>
				<div className="text-muted-foreground">{cell.label}</div>
			</div>
		);
	};

	const weekdayLabelWidth = showAxis && showWeekdays ? 44 : 0;

	return (
		<div className={cn("flex w-full flex-col gap-2", className)}>
			<TooltipProvider delayDuration={80}>
				<div
					ref={scrollRef}
					className={cn(
						"flex w-full gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						placement === "bottom" && "flex-col",
					)}
				>
					{/* Labeled calendar area */}
					<div className={cn("shrink-0 grow", axisCfg.className)}>
						{/* Month labels row */}
						{showAxis && showMonths ? (
							<div
								className="flex items-end"
								style={{ paddingLeft: weekdayLabelWidth }}
							>
								<div
									className="relative"
									style={{
										height: 18,
										width: columns.length * (s + cellGap) - cellGap,
									}}
								>
									{monthLabels.map((m) => (
										<div
											key={m.colIndex}
											className="absolute text-xs text-muted-foreground"
											style={{
												left: m.colIndex * (s + cellGap),
												top: 0,
											}}
										>
											{m.text}
										</div>
									))}
								</div>
							</div>
						) : null}

						<div className="flex">
							{/* Weekday labels column */}
							{showAxis && showWeekdays ? (
								<div
									className="mr-2 flex flex-col"
									style={{ gap: `${cellGap}px` }}
									aria-hidden="true"
								>
									{Array.from({ length: 7 }).map((_, rowIdx) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: weekday rows are positionally stable
											key={rowIdx}
											className="flex items-center justify-end text-xs text-muted-foreground"
											style={{ width: 40, height: s }}
										>
											{weekdayIndices.includes(rowIdx)
												? weekdayLabelForIndex(rowIdx, weekStartsOn)
												: ""}
										</div>
									))}
								</div>
							) : null}

							{/* Heatmap grid */}
							<div
								className="flex"
								style={{ gap: `${cellGap}px` }}
								role="grid"
								aria-label="Heatmap calendar"
							>
								{columns.map((col, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: week columns are positionally stable
										key={i}
										className="flex flex-col"
										style={{ gap: `${cellGap}px` }}
										role="rowgroup"
									>
										{col.map((cell) => {
											const cls = levels[clampLevel(cell.level, levels.length)];
											const inert = cell.disabled || cell.future;
											return (
												<Tooltip key={cell.key}>
													<TooltipTrigger asChild>
														<button
															type="button"
															disabled={inert}
															onClick={() => !inert && onCellClick?.(cell)}
															className={cn(
																"rounded-[3px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
																!palette?.length && cls,
																inert &&
																	"cursor-default opacity-30 pointer-events-none",
															)}
															style={{
																width: s,
																height: s,
																...(bgStyleForLevel(cell.level, palette) ?? {}),
															}}
															aria-label={
																cell.disabled
																	? "Outside range"
																	: cell.future
																		? `${cell.label}: Upcoming`
																		: `${cell.label}: ${cell.value}`
															}
															role="gridcell"
														/>
													</TooltipTrigger>
													<TooltipContent side="top">
														{tooltipNode(cell)}
													</TooltipContent>
												</Tooltip>
											);
										})}
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Legend */}
					{LegendUI}
				</div>
			</TooltipProvider>
		</div>
	);
}
