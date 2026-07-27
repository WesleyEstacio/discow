"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { Disc3Icon, Loader2Icon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatReleaseYear } from "@/lib/format"
import type { AlbumSummary } from "@/lib/types"

type LibrarySearchProps = {
  autoFocus?: boolean
}

type SuggestionsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; albums: AlbumSummary[] }

const SUGGESTION_DEBOUNCE_MS = 400
const SUGGESTION_LIMIT = 6
// Each suggestion row is ~56px tall (40px thumbnail + padding); capping the
// visible list at 5 rows means the 6th result is reachable by scrolling.
const SUGGESTION_ROW_HEIGHT_PX = 56
const SUGGESTION_LIST_MAX_VISIBLE_ROWS = 5

const COMBINING_DIACRITICAL_MARKS_PATTERN = /[\u0300-\u036f]/g

function normalizeForMatching(text: string) {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICAL_MARKS_PATTERN, "")
    .toLowerCase()
    .trim()
}

// Spotify's search always fills the requested limit with its best-effort
// ranked matches - it has no "only return confident matches" option. So when
// the query is basically the album title (typed in full, minor typos aside),
// we narrow the dropdown down to just the album(s) that closely match the
// text instead of always padding it out to `limit` loosely related results.
function pickRelevantAlbums(query: string, albums: AlbumSummary[]): AlbumSummary[] {
  const normalizedQuery = normalizeForMatching(query)

  const closeMatches = albums.filter((album) => {
    const normalizedAlbumName = normalizeForMatching(album.name)
    return (
      normalizedAlbumName === normalizedQuery ||
      normalizedAlbumName.startsWith(normalizedQuery) ||
      normalizedQuery.startsWith(normalizedAlbumName)
    )
  })

  return closeMatches.length > 0 ? closeMatches : albums
}

export function LibrarySearch({ autoFocus = false }: LibrarySearchProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionsState>({ status: "idle" })
  const debouncedQuery = useDebouncedValue(query.trim(), SUGGESTION_DEBOUNCE_MS)

  // Fetch suggestions only after the user has paused typing, so we don't
  // hammer the Spotify-backed search route on every keystroke.
  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions({ status: "idle" })
      return
    }

    const abortController = new AbortController()
    setSuggestions({ status: "loading" })

    fetch(
      `/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}&limit=${SUGGESTION_LIMIT}`,
      { signal: abortController.signal }
    )
      .then((response) => response.json())
      .then((data: { albums?: AlbumSummary[]; error?: string }) => {
        if (data.error) {
          setSuggestions({ status: "error", message: data.error })
          return
        }
        setSuggestions({ status: "success", albums: data.albums ?? [] })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSuggestions({
          status: "error",
          message: "Could not load suggestions right now.",
        })
      })

    return () => abortController.abort()
  }, [debouncedQuery])

  useEffect(() => {
    function closeIfClickedOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeIfClickedOutside)
    return () => document.removeEventListener("pointerdown", closeIfClickedOutside)
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    setIsDropdownOpen(false)
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  function handleSelectAlbum(albumId: string) {
    setIsDropdownOpen(false)
    router.push(`/album/${albumId}`)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setIsDropdownOpen(false)
  }

  const isDropdownVisible = isDropdownOpen && debouncedQuery.length > 0
  const visibleAlbums =
    suggestions.status === "success"
      ? pickRelevantAlbums(debouncedQuery, suggestions.albums)
      : []

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="library-search" className="sr-only">
            Search albums, artists, or users
          </FieldLabel>
          <div className="flex items-center gap-2">
            <div ref={containerRef} className="relative flex-1">
              <Input
                id="library-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setIsDropdownOpen(true)
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search albums, artists, or users..."
                autoFocus={autoFocus}
                autoComplete="off"
                role="combobox"
                aria-expanded={isDropdownVisible}
                aria-controls="library-search-results"
              />

              {isDropdownVisible ? (
                <div
                  id="library-search-results"
                  role="listbox"
                  aria-label="Album suggestions"
                  className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
                >
                  {suggestions.status === "loading" ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                      <Loader2Icon className="size-4 animate-spin" />
                      Searching...
                    </div>
                  ) : null}

                  {suggestions.status === "error" ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      {suggestions.message}
                    </p>
                  ) : null}

                  {suggestions.status === "success" && visibleAlbums.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No albums matched &ldquo;{debouncedQuery}&rdquo;.
                    </p>
                  ) : null}

                  {suggestions.status === "success" && visibleAlbums.length > 0 ? (
                    // ScrollArea's viewport is styled with height: 100%, so it
                    // needs an ancestor with a *definite* height (not just
                    // max-height) to actually scroll instead of clipping. We
                    // size it to fit up to SUGGESTION_LIST_MAX_VISIBLE_ROWS
                    // rows exactly, so it never shows dead space but still
                    // scrolls once there are more results than that.
                    <ScrollArea
                      style={{
                        height:
                          Math.min(
                            visibleAlbums.length,
                            SUGGESTION_LIST_MAX_VISIBLE_ROWS
                          ) *
                            SUGGESTION_ROW_HEIGHT_PX +
                          8,
                      }}
                    >
                      <ul className="py-1">
                        {visibleAlbums.map((album) => (
                          <li key={album.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => handleSelectAlbum(album.id)}
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
                                  {album.artists.join(", ")} ·{" "}
                                  {formatReleaseYear(album.releaseDate)}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Button type="submit">
              <SearchIcon data-icon="inline-start" />
              Search
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  )
}
