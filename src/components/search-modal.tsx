"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SearchResultsList } from "@/components/search-results-list"
import { useCombinedSearch } from "@/hooks/use-combined-search"

type SearchModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MODAL_MAX_VISIBLE_ROWS = 8

/**
 * Command-palette-style search shared by both search entry points in the
 * app (the header trigger and the library hero trigger): a modal with a
 * prominent input up top and the combined album+user results directly
 * below it, instead of a small inline dropdown anchored to the trigger.
 */
export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  // Album/user limits use the hook's defaults (6 and 4).
  const { debouncedQuery, state } = useCombinedSearch(query)

  function close() {
    onOpenChange(false)
    setQuery("")
  }

  function handleSelectAlbum(albumId: string) {
    close()
    router.push(`/album/${albumId}`)
  }

  function handleSelectUser(username: string) {
    close()
    router.push(`/profile/${username}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search albums or users</DialogTitle>

        <div className="relative border-b">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search albums or @username..."
            autoComplete="off"
            role="combobox"
            aria-expanded={debouncedQuery.length > 0}
            aria-controls="search-modal-results"
            className="h-12 rounded-none border-0 pl-11 text-base shadow-none focus-visible:ring-0"
          />
        </div>

        {debouncedQuery.length > 0 ? (
          <SearchResultsList
            listboxId="search-modal-results"
            query={debouncedQuery}
            state={state}
            onSelectAlbum={handleSelectAlbum}
            onSelectUser={handleSelectUser}
            maxVisibleRows={MODAL_MAX_VISIBLE_ROWS}
          />
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Start typing to search albums or users.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
