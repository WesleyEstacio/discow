"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CompassIcon,
  Disc3Icon,
  LogOutIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOutUser } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home", icon: Disc3Icon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
]

export type AppHeaderUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type AppHeaderProps = {
  user: AppHeaderUser | null
}

export function AppHeader({ user }: AppHeaderProps) {
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

        {user ? (
          <form action={signOutUser} className="flex items-center gap-2">
            <Avatar size="sm">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? "Profile picture"} />
              ) : null}
              <AvatarFallback>
                {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button type="submit" variant="ghost" size="sm">
              <LogOutIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  )
}
