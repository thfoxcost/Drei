import type { CSSProperties } from "react";

import { cn } from "#/lib/utils";

import "./dot-matrix-loader.css";

const MATRIX_SIZE = 5;
const MAX_PATH = (MATRIX_SIZE - 1) * 2;

interface DotMatrixLoaderProps {
	size?: number;
	dotSize?: number;
	speed?: number;
	className?: string;
	ariaLabel?: string;
}

function DotMatrixLoader({
	size = 112,
	dotSize = 11,
	speed = 1.1,
	className,
	ariaLabel = "Loading",
}: DotMatrixLoaderProps) {
	const gap = Math.max(
		1,
		Math.floor((size - dotSize * MATRIX_SIZE) / (MATRIX_SIZE - 1)),
	);

	const dots = Array.from({ length: MATRIX_SIZE * MATRIX_SIZE }, (_, index) => {
		const row = Math.floor(index / MATRIX_SIZE);
		const col = index % MATRIX_SIZE;
		const slice = row + (MATRIX_SIZE - 1 - col);

		return {
			row,
			col,
			path: slice / MAX_PATH,
			parity: slice % 2,
		};
	});

	const rootStyle = {
		width: size,
		height: size,
		"--dmx-speed": 1 / speed,
		"--dmx-dot-size": `${dotSize}px`,
	} as CSSProperties;

	return (
		<output
			aria-live="polite"
			aria-label={ariaLabel}
			className={cn("dmx-root dmx-dot-shape-circle", className)}
			style={rootStyle}
		>
			<div className="dmx-grid" style={{ gap }}>
				{dots.map(({ row, col, path, parity }) => (
					<span
						key={`${row}-${col}`}
						aria-hidden="true"
						className="dmx-dot dmx-diagonal-alt-sweep"
						style={
							{
								width: dotSize,
								height: dotSize,
								"--dmx-path": path,
								"--dmx-diagonal-parity": parity,
							} as CSSProperties
						}
					/>
				))}
			</div>
		</output>
	);
}

export default DotMatrixLoader;
