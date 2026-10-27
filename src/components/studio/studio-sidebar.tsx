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
import { cn } from "@/lib/utils"

type StudioNavigationItem = {
  href: string
  label: string
  icon: LucideIcon
  matchesExactly?: boolean
}

const STUDIO_NAVIGATION_ITEMS: StudioNavigationItem[] = [
  { href: "/studio", label: "Visão geral", icon: LayoutDashboardIcon, matchesExactly: true },
  { href: "/studio/posts", label: "Biblioteca de conteúdo", icon: RowsIcon },
  { href: "/studio/create", label: "Criar publicação", icon: PlusIcon },
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
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4 md:block">
        <Link
          href="/studio"
          className="block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="block text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Discows
          </span>
          <span className="block font-heading text-xl font-semibold tracking-tight">Studio</span>
        </Link>
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-border px-5 py-4 text-xs text-muted-foreground md:block">
        <p className="truncate" title={adminEmail}>
          {adminEmail}
        </p>
        <a
          href="/library"
          className="mt-2 inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Voltar para o Discows
          <ArrowUpRightIcon className="size-3" aria-hidden="true" />
        </a>
      </div>
    </aside>
  )
}
