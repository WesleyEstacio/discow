"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { Disc3Icon, Loader2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatReleaseYear } from "@/lib/format"
import type { CombinedSearchState } from "@/hooks/use-combined-search"

type SearchResultsListProps = {
  listboxId: string
  query: string
  state: CombinedSearchState
  onSelectAlbum: (albumId: string) => void
  onSelectUser: (username: string) => void
  maxVisibleRows?: number
}

// Each row is ~56px tall (40px thumbnail/avatar + padding) and section labels
// are shorter; this caps the list at roughly 5 result rows before it
// scrolls by default, so it never dominates the page but doesn't clip real
// matches. Callers with more room (the search modal) can raise this.
const ROW_HEIGHT_PX = 56
const LABEL_HEIGHT_PX = 28
const DEFAULT_MAX_VISIBLE_ROWS = 5

/**
 * Shared dropdown body for every search surface in the app (header +
 * library hero): albums first, then users, each section only rendered when
 * it actually has matches - so a query with no user matches just shows
 * albums, and vice versa, instead of an empty "Users" heading. Typing a
 * leading "@" is treated as an explicit "I'm looking for a person" signal,
 * so that flips the order and shows Users first.
 */
export function SearchResultsList({
  listboxId,
  query,
  state,
  onSelectAlbum,
  onSelectUser,
  maxVisibleRows = DEFAULT_MAX_VISIBLE_ROWS,
}: SearchResultsListProps) {
  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Searching...
      </div>
    )
  }

  if (state.status === "error") {
    return <p className="px-3 py-4 text-sm text-muted-foreground">{state.message}</p>
  }

  if (state.status !== "success") return null

  const { albums, users } = state

  if (albums.length === 0 && users.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        No results for &ldquo;{query}&rdquo;.
      </p>
    )
  }

  const rowCount = albums.length + users.length
  const labelCount = (albums.length > 0 ? 1 : 0) + (users.length > 0 ? 1 : 0)
  const visibleRowCount = Math.min(rowCount, maxVisibleRows)
  const prioritizeUsers = query.trim().startsWith("@")

  // Each section is a flat array of <li> siblings (a label followed by its
  // rows) rather than a nested <ul>, so the listbox keeps a single flat list
  // of options - only the *order* the two arrays are concatenated in changes
  // based on `prioritizeUsers`.
  const albumRows =
    albums.length > 0
      ? [
          <SectionLabel key="albums-label">Albums</SectionLabel>,
          ...albums.map((album) => (
            <li key={`album-${album.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelectAlbum(album.id)}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {album.imageUrl ? (
                    <Image
                      src={album.imageUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Disc3Icon className="size-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{album.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {album.artists.join(", ")} · {formatReleaseYear(album.releaseDate)}
                  </p>
                </div>
              </button>
            </li>
          )),
        ]
      : []

  const userRows =
    users.length > 0
      ? [
          <SectionLabel key="users-label">Users</SectionLabel>,
          ...users.map((user) => (
            <li key={`user-${user.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelectUser(user.username)}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Avatar size="sm">
                  {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                  <AvatarFallback>
                    {(user.name ?? user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name ?? `@${user.username}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </button>
            </li>
          )),
        ]
      : []

  const orderedRows = prioritizeUsers
    ? [...userRows, ...albumRows]
    : [...albumRows, ...userRows]

  return (
    <ScrollArea
      style={{
        height: visibleRowCount * ROW_HEIGHT_PX + labelCount * LABEL_HEIGHT_PX + 8,
      }}
    >
      <ul id={listboxId} role="listbox" aria-label="Search results" className="py-1">
        {orderedRows}
      </ul>
    </ScrollArea>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <li
      role="presentation"
      className="px-3 pt-2 pb-1 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
    >
      {children}
    </li>
  )
}
