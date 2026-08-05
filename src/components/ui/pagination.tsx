import type { ComponentProps } from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import type { VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Plain <nav>/<ul>/<button> building blocks styled like the rest of the
// button-driven UI here - unlike a typical shadcn pagination (which renders
// <a> tags for URL-based page routes), every page in this app that needs
// pagination so far slices an already-loaded array in memory, so these are
// buttons with onClick handlers instead of links.
function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem(props: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<VariantProps<typeof buttonVariants>, "size"> &
  ComponentProps<"button">

function PaginationLink({
  className,
  isActive = false,
  size = "icon-sm",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? "secondary" : "ghost", size }), className)}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: ComponentProps<"button">) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <ChevronLeftIcon />
      <span className="hidden sm:inline">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: ComponentProps<"button">) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <span className="hidden sm:inline">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-8 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
