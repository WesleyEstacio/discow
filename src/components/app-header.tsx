"use client"

import { Suspense, use } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  CompassIcon,
  LibraryIcon,
  LogOutIcon,
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
import { HeaderSearch } from "@/components/header-search"
import { SignInButton } from "@/components/sign-in-button"
import { signOutUser } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"

// "Profile" used to live here as a third nav link; it's now folded into the
// account avatar menu below, and this slot is the search bar instead (see
// HeaderSearch).
const links = [
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
]

export type AppHeaderUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  username?: string | null
}

type AppHeaderProps = {
  // A promise instead of the resolved user so the header shell (logo + nav)
  // can render immediately; only the account slot below suspends on it.
  userPromise: Promise<AppHeaderUser | null>
}

export function AppHeader({ userPromise }: AppHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/library"
          className="flex items-center gap-2 rounded-md font-heading text-lg font-semibold tracking-tight outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <DiscowsLogo size={24} />
          Discows
        </Link>

        {/* Nav links and search are grouped as one unit so they move as a
            block and keep their own spacing, instead of each being spread
            out independently by justify-between. */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const active = pathname.startsWith(link.href)

              return (
                <NavLinkButton
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={Icon}
                  active={active}
                  disabled={false}
                />
              )
            })}
          </nav>

          <HeaderSearch />
        </div>

        <Suspense fallback={<AccountSlotSkeleton />}>
          <AccountSlot userPromise={userPromise} />
        </Suspense>
      </div>
    </header>
  )
}

type NavLinkButtonProps = {
  href: string
  label: string
  icon: typeof LibraryIcon
  active: boolean
  disabled: boolean
}

// Rendered twice - a centered icon-only button on mobile, and an icon+label
// button from `sm` up - instead of hiding the label with CSS. The shared
// Button component pads icon+label layouts asymmetrically (tighter on the
// icon side), which only looks centered when the label is actually visible.
function NavLinkButton({ href, label, icon: Icon, active, disabled }: NavLinkButtonProps) {
  return (
    <>
      <Button
        variant={active ? "secondary" : "ghost"}
        size="icon-sm"
        disabled={disabled}
        render={<Link href={href} aria-label={label} />}
        nativeButton={false}
        className="sm:hidden"
      >
        <Icon />
      </Button>
      <Button
        variant={active ? "secondary" : "ghost"}
        size="sm"
        disabled={disabled}
        render={<Link href={href} />}
        nativeButton={false}
        className={cn("hidden sm:inline-flex", active && "font-medium")}
      >
        <Icon data-icon="inline-start" />
        {label}
      </Button>
    </>
  )
}

function AccountSlotSkeleton() {
  return <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
}

function AccountSlot({ userPromise }: { userPromise: Promise<AppHeaderUser | null> }) {
  const user = use(userPromise)
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile"

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  if (!user) {
    return <SignInButton />
  }

  return (
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
        <DropdownMenuLinkItem render={<Link href={profileHref} />} closeOnClick>
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
  )
}
