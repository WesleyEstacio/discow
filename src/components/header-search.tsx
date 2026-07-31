"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"

/**
 * Header search trigger, in the slot the "Profile" link used to occupy
 * (profile is still reachable from the account avatar menu). Styled and
 * rendered exactly like the Library/Discover nav buttons (see
 * `NavLinkButton` in app-header.tsx) - icon-only on mobile, icon+label from
 * `sm` up - instead of looking like a search field. Clicking it opens the
 * shared `SearchModal`, same as the library hero trigger.
 */
export function HeaderSearch() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Search albums or users"
        onClick={() => setOpen(true)}
        className="sm:hidden"
      >
        <SearchIcon />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Search albums or users"
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex"
      >
        <SearchIcon data-icon="inline-start" />
        Search
      </Button>

      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}
