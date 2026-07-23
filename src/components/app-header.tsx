"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CompassIcon, Disc3Icon, SearchIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home", icon: Disc3Icon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <Disc3Icon className="size-5" />
          Discow
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)

            return (
              <Button
                key={link.href}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                render={<Link href={link.href} />}
                nativeButton={false}
                className={cn(active && "font-medium")}
              >
                <Icon data-icon="inline-start" />
                <span className="hidden sm:inline">{link.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
