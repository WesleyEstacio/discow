"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpRightIcon,
  Disc3Icon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  type LucideIcon,
  PlusIcon,
  RowsIcon,
  SettingsIcon,
} from "lucide-react"
import { DISCOWS_BRAND_PINK, DiscowsWordmark } from "@/components/brand/discows-wordmark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type StudioNavigationItem = {
  href: string
  label: string
  icon: LucideIcon
  matchesExactly?: boolean
}

const STUDIO_NAVIGATION_ITEMS: StudioNavigationItem[] = [
  { href: "/studio", label: "Visão geral", icon: LayoutDashboardIcon, matchesExactly: true },
  { href: "/studio/posts", label: "Publicações", icon: RowsIcon },
  { href: "/studio/music", label: "Biblioteca musical", icon: Disc3Icon },
  { href: "/studio/templates", label: "Modelos", icon: LayoutTemplateIcon },
  { href: "/studio/settings", label: "Configurações", icon: SettingsIcon },
]

function isNavigationItemActive(item: StudioNavigationItem, pathname: string): boolean {
  if (item.matchesExactly) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function StudioSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex shrink-0 flex-col border-b border-border bg-sidebar md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-5 md:flex-col md:items-stretch md:gap-6">
        <Link
          href="/studio"
          aria-label="Discows Studio, visão geral"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <DiscowsWordmark height={30} inkColor="currentColor" accentColor={DISCOWS_BRAND_PINK} />
          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">Studio</span>
        </Link>
        <Button render={<Link href="/studio/create" />} nativeButton={false} className="md:w-full">
          <PlusIcon data-icon="inline-start" />
          Nova publicação
        </Button>
      </div>

      <nav aria-label="Navegação do Studio" className="overflow-x-auto px-3 pb-3 md:flex-1 md:overflow-visible">
        <ul className="flex gap-1 md:flex-col">
          {STUDIO_NAVIGATION_ITEMS.map((item) => {
            const isActive = isNavigationItemActive(item, pathname)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                    isActive &&
                      "bg-sidebar-accent font-medium text-sidebar-accent-foreground md:before:absolute md:before:inset-y-2 md:before:-left-3 md:before:w-1 md:before:rounded-r-full md:before:bg-primary"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden items-center gap-3 border-t border-border px-5 py-4 md:flex">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary uppercase"
        >
          {adminEmail.slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-col text-xs">
          <p className="truncate text-foreground" title={adminEmail}>
            {adminEmail}
          </p>
          <a
            href="/library"
            className="inline-flex w-fit items-center gap-1 rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Voltar para o Discows
            <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  )
}
