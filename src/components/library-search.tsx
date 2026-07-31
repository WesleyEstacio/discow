"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SearchModal } from "@/components/search-modal"

type LibrarySearchProps = {
  autoFocus?: boolean
}

/**
 * Library hero search trigger. Looks like a search field, but is actually a
 * button - clicking (or pressing Enter/Space while focused) opens the
 * shared `SearchModal`, where the real input and results live.
 */
export function LibrarySearch({ autoFocus = false }: LibrarySearchProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <FieldGroup className="w-full">
        <Field>
          <FieldLabel htmlFor="library-search-trigger" className="sr-only">
            Search albums or users
          </FieldLabel>
          <button
            id="library-search-trigger"
            type="button"
            autoFocus={autoFocus}
            onClick={() => setOpen(true)}
            className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-muted-foreground outline-none transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate text-sm">Search albums or @username...</span>
          </button>
        </Field>
      </FieldGroup>

      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}
