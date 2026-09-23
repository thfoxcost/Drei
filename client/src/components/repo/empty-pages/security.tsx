function Security() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-6">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted/50">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-muted-foreground"
					>
						<path d="M12 2l8 3.5v6.5c0 3.5-3.5 8-8 10c-4.5-2-8-6.5-8-10V5.5L12 2Z" />
						<path d="M4 4l16 16" />
					</svg>
				</div>

				<h1 className="text-lg font-semibold">Security</h1>

				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					Security feature haven't been implemented yet.
					They'll be available in a future update.
				</p>
			</div>
		</div>
	)
}

export default Security