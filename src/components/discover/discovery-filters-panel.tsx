"use client"

import { useState, type ComponentType } from "react"
import { motion } from "framer-motion"
import {
  CalendarIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  RotateCcwIcon,
  TagIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DISCOVER_DECADES,
  DISCOVER_GENRES,
  formatDecadeLabel,
  formatGenreLabel,
  type DiscoverFilters,
} from "@/lib/discover"
import { cn } from "@/lib/utils"

const PANEL_OPEN_WIDTH = 300
const PANEL_COLLAPSED_WIDTH = 64

type DiscoveryFiltersPanelProps = {
  filters: DiscoverFilters
  onFiltersChange: (filters: DiscoverFilters) => void
  onClean: () => void
  className?: string
}

// Starts open (per the design) and toggles to a narrow icon-only rail on
// click - it never fully disappears, and the featured card next to it (see
// discover-featured-card.tsx) grows with flex-1, so the width this panel
// frees up (or reclaims) is absorbed smoothly by the other side instead of
// the layout jumping. Below the `lg` breakpoint both sides stack full-width
// instead, so the collapse toggle is most useful once they sit side by side.
export function DiscoveryFiltersPanel({
  filters,
  onFiltersChange,
  onClean,
  className,
}: DiscoveryFiltersPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? PANEL_OPEN_WIDTH : PANEL_COLLAPSED_WIDTH }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      className={cn(
        "flex w-full shrink-0 flex-col gap-4 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground lg:w-auto",
        className
      )}
    >
      <div className={cn("flex items-center gap-2", open ? "justify-between" : "justify-center")}>
        {open ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="truncate font-heading text-base font-semibold tracking-tight">
              Discovery Filters
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              Narrow the catalogue, or roll dice.
            </p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={open ? "Collapse discovery filters" : "Expand discovery filters"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="shrink-0"
        >
          {open ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
        </Button>
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", !open && "items-center")}>
        <DecadeFilterControl
          collapsed={!open}
          value={filters.decadeStartYear}
          onChange={(decadeStartYear) => onFiltersChange({ ...filters, decadeStartYear })}
        />
        <GenreFilterControl
          collapsed={!open}
          value={filters.genre}
          onChange={(genre) => onFiltersChange({ ...filters, genre })}
        />
      </div>

      <Button
        type="button"
        variant="default"
        size={open ? "default" : "icon-sm"}
        aria-label="Clean filters"
        onClick={onClean}
        className="mt-auto w-full"
      >
        <RotateCcwIcon data-icon={open ? "inline-start" : undefined} />
        {open ? "Clean Filters" : null}
      </Button>
    </motion.aside>
  )
}

type FilterPopoverButtonProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  valueLabel: string | null
  collapsed: boolean
  // Render prop instead of a plain node so each OptionRow can close this
  // specific popover right after picking a value - a listener choosing
  // "Hip-Hop" wants the popover gone immediately, not left open until they
  // click elsewhere.
  children: (close: () => void) => React.ReactNode
}

function FilterPopoverButton({
  icon: Icon,
  label,
  valueLabel,
  collapsed,
  children,
}: FilterPopoverButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            aria-label={collapsed ? label : undefined}
            className={cn(!collapsed && "w-full justify-start font-normal", collapsed && "justify-center")}
            size={collapsed ? "icon" : "default"}
          />
        }
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        {!collapsed ? (
          <span className={cn("truncate", !valueLabel && "text-muted-foreground")}>
            {valueLabel ?? label}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

function OptionRow({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent font-medium text-accent-foreground"
      )}
    >
      {children}
    </button>
  )
}

type DecadeFilterControlProps = {
  collapsed: boolean
  value: number | null
  onChange: (value: number | null) => void
}

function DecadeFilterControl({ collapsed, value, onChange }: DecadeFilterControlProps) {
  return (
    <FilterPopoverButton
      icon={CalendarIcon}
      label="Decade"
      valueLabel={value !== null ? formatDecadeLabel(value) : null}
      collapsed={collapsed}
    >
      {(close) => (
        <div className="flex flex-col gap-0.5">
          <OptionRow
            active={value === null}
            onClick={() => {
              onChange(null)
              close()
            }}
          >
            Any decade
          </OptionRow>
          {DISCOVER_DECADES.map((year) => (
            <OptionRow
              key={year}
              active={value === year}
              onClick={() => {
                onChange(year)
                close()
              }}
            >
              {formatDecadeLabel(year)}
            </OptionRow>
          ))}
        </div>
      )}
    </FilterPopoverButton>
  )
}

type GenreFilterControlProps = {
  collapsed: boolean
  value: string | null
  onChange: (value: string | null) => void
}

function GenreFilterControl({ collapsed, value, onChange }: GenreFilterControlProps) {
  return (
    <FilterPopoverButton
      icon={TagIcon}
      label="Genre"
      valueLabel={value ? formatGenreLabel(value) : null}
      collapsed={collapsed}
    >
      {(close) => (
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          <OptionRow
            active={value === null}
            onClick={() => {
              onChange(null)
              close()
            }}
          >
            Any genre
          </OptionRow>
          {DISCOVER_GENRES.map((genre) => (
            <OptionRow
              key={genre}
              active={value === genre}
              onClick={() => {
                onChange(genre)
                close()
              }}
            >
              {formatGenreLabel(genre)}
            </OptionRow>
          ))}
        </div>
      )}
    </FilterPopoverButton>
  )
}
