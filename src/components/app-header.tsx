"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  CompassIcon,
  LibraryIcon,
  LogOutIcon,
  SearchIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DiscowsLogo } from "@/components/discows-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignInButton } from "@/components/sign-in-button"
import { signOutUser } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"

const links = [
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/profile", label: "Profile", icon: UserIcon, requiresAuth: true },
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
  const { resolvedTheme, setTheme } = useTheme()

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <DiscowsLogo size={24} />
          Discows
        </div>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname.startsWith(link.href)
            const disabled = link.requiresAuth && !user

            return (
              <Button
                key={link.href}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                disabled={disabled}
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
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Account menu"
            >
              <Avatar size="sm">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name ?? "Profile picture"} />
                ) : null}
                <AvatarFallback>
                  {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.name ?? user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLinkItem render={<Link href="/profile" />} closeOnClick>
                <UserIcon />
                Profile
              </DropdownMenuLinkItem>
              <DropdownMenuItem onClick={handleToggleTheme}>
                <SunMoonIcon />
                Toggle theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOutUser(pathname)}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SignInButton />
        )}
      </div>
    </header>
  )
}
