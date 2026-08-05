"use client"

import { useEffect, useMemo, useState } from "react"
import { DiscoverAlbumsGrid } from "@/components/discover/discover-albums-grid"
import { DiscoverFeaturedCard } from "@/components/discover/discover-featured-card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MAX_DISCOVER_HISTORY_ENTRIES,
  readDiscoverHistory,
  writeDiscoverHistory,
  type CommunityRating,
  type DiscoverFilters,
  type DiscoverHistoryEntry,
  type DiscoverRollResult,
} from "@/lib/discover"

// The Discovery Filters panel (Decade/Genre) is temporarily disabled - the
// underlying Spotify genre matching wasn't reliable enough, so every roll
// goes through the plain, reliable free/decade-only path in
// discover-server.ts for now instead of ever locking a genre. The panel
// component and the filter-matching logic in discover-server.ts are left in
// place (just unused) so this can be turned back on later without a rewrite.
const EMPTY_FILTERS: DiscoverFilters = { genre: null, decadeStartYear: null }

function toHistoryEntry(result: DiscoverRollResult): DiscoverHistoryEntry {
  return { album: result.album, genreLabel: result.genreLabel, roll: result.roll }
}

type DiscoverExperienceProps = {
  isSignedIn: boolean
  // Only ever set (and only ever needed) for signed-in listeners - the
  // Server Component page already resolved their history (and, if it was
  // empty, rolled and saved their first pick) straight from the database
  // before this component ever mounts. Guests read their own history from
  // localStorage on the client instead, see the lazy useState below.
  initialHistory?: DiscoverHistoryEntry[]
  initialBootstrapError?: string | null
}

// Orchestrates the whole Discover experience: the listener's roll history
// (the database for signed-in listeners, the browser for guests - see
// src/lib/discover.ts and src/lib/discover-server.ts), the currently
// featured pick (always "the last item in history"), the Discovery Filters
// panel, and the community rating lookup for every album on screen.
export function DiscoverExperience({
  isSignedIn,
  initialHistory,
  initialBootstrapError = null,
}: DiscoverExperienceProps) {
  const [history, setHistory] = useState<DiscoverHistoryEntry[]>(
    () => initialHistory ?? (isSignedIn ? [] : readDiscoverHistory())
  )
  const [ratings, setRatings] = useState<Record<string, CommunityRating>>({})
  const [bootstrapError, setBootstrapError] = useState<string | null>(initialBootstrapError)

  const featuredEntry = history[history.length - 1] ?? null
  const gridAlbums = useMemo(() => [...history].reverse().map((entry) => entry.album), [history])
  const historyAlbumIds = useMemo(() => history.map((entry) => entry.album.id), [history])

  function appendHistoryEntry(entry: DiscoverHistoryEntry) {
    setHistory((current) => {
      const next = [...current, entry].slice(-MAX_DISCOVER_HISTORY_ENTRIES)
      // Signed-in listeners already had this entry saved server-side (the
      // roll route appends to discover_pick whenever a session exists) -
      // only guests need it mirrored into localStorage here.
      if (!isSignedIn) writeDiscoverHistory(next)
      return next
    })
  }

  // Runs once on mount for guests only: a listener with no Discover history
  // yet (first-ever visit, or a cleared browser) gets one album rolled for
  // them immediately, exactly like clicking Surprise Me with no filters
  // locked. Signed-in listeners never reach this - the Server Component
  // page already bootstrapped their history from the database before this
  // component mounted. This has to be an effect since it depends on
  // localStorage and a network request, neither of which is derivable
  // during render.
  useEffect(() => {
    if (isSignedIn) return
    if (history.length > 0) return

    let cancelled = false
    setBootstrapError(null)

    fetch("/api/discover/roll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: EMPTY_FILTERS, excludeIds: [] }),
    })
      .then(async (response) => {
        const data = (await response.json()) as Partial<DiscoverRollResult> & { error?: string }
        if (!response.ok || !data.album || !data.roll) {
          throw new Error(data.error ?? "Failed to load Discover")
        }
        if (cancelled) return
        appendHistoryEntry(
          toHistoryEntry({ album: data.album, genreLabel: data.genreLabel ?? null, roll: data.roll })
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : "Failed to load Discover")
        }
      })

    return () => {
      cancelled = true
    }
    // Intentionally runs once - appendHistoryEntry's own updates already
    // move `history` past zero, so re-running this on every history change
    // would fight with it instead of only ever bootstrapping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  // Batches the community rating lookup for every album currently in
  // history into a single request whenever the set of ids changes.
  useEffect(() => {
    if (historyAlbumIds.length === 0) return

    let cancelled = false

    fetch(`/api/discover/ratings?ids=${historyAlbumIds.join(",")}`)
      .then((response) => response.json())
      .then((data: { ratings?: Record<string, CommunityRating> }) => {
        if (!cancelled) setRatings(data.ratings ?? {})
      })
      .catch(() => {
        // Ratings are a nice-to-have on this page - a failed lookup just
        // leaves cards without a community rating instead of blocking
        // anything else.
      })

    return () => {
      cancelled = true
    }
  }, [historyAlbumIds])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Discover</h1>
        <p className="text-muted-foreground">
          Roll the dice for a new pick, or browse what Discover has shown you so far.
        </p>
      </div>

      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {featuredEntry ? (
          <DiscoverFeaturedCard
            album={featuredEntry.album}
            genreLabel={featuredEntry.genreLabel}
            communityRating={ratings[featuredEntry.album.id] ?? null}
            filters={EMPTY_FILTERS}
            excludeIds={historyAlbumIds}
            onRolled={appendHistoryEntry}
          />
        ) : bootstrapError ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Discover is unavailable right now</EmptyTitle>
              <EmptyDescription>{bootstrapError}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <FeaturedCardSkeleton />
        )}
      </section>

      <DiscoverAlbumsGrid albums={gridAlbums} communityRatings={ratings} />
    </main>
  )
}

function FeaturedCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:flex-row">
      <Skeleton className="mx-auto aspect-square w-full max-w-52 shrink-0 rounded-xl sm:mx-0" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-56" />
      </div>
    </div>
  )
}
