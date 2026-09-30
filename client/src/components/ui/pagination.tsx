import type { VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "#/components/ui/button.tsx";
import { cn } from "#/lib/utils.ts";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	const { t } = useTranslation();

	return (
		<nav
			aria-label={t("common.actions.pagination")}
			data-slot="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			{...props}
		/>
	);
}

function PaginationContent({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="pagination-content"
			className={cn("flex flex-row items-center gap-1", className)}
			{...props}
		/>
	);
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
	isActive?: boolean;
} & VariantProps<typeof buttonVariants> &
	React.ComponentProps<"a">;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) {
	return (
		<a
			aria-current={isActive ? "page" : undefined}
			data-slot="pagination-link"
			data-active={isActive}
			className={cn(
				buttonVariants({
					variant: isActive ? "outline" : "ghost",
					size,
				}),
				className,
			)}
			{...props}
		/>
	);
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	const { t } = useTranslation();

	return (
		<PaginationLink
			aria-label={t("common.actions.previousPage")}
			size="default"
			className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
			{...props}
		>
			<ChevronLeft />
			<span className="hidden sm:block">{t("common.actions.previous")}</span>
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	const { t } = useTranslation();

	return (
		<PaginationLink
			aria-label={t("common.actions.nextPage")}
			size="default"
			className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
			{...props}
		>
			<span className="hidden sm:block">{t("common.actions.next")}</span>
			<ChevronRight />
		</PaginationLink>
	);
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	const { t } = useTranslation();

	return (
		<span
			aria-hidden
			data-slot="pagination-ellipsis"
			className={cn("flex size-9 items-center justify-center", className)}
			{...props}
		>
			<MoreHorizontal className="size-4" />
			<span className="sr-only">{t("common.actions.morePages")}</span>
		</span>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
