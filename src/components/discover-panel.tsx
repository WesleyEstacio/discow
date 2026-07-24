"use client"

import { useMemo, useState } from "react"
import { DicesIcon, Loader2Icon, SparklesIcon } from "lucide-react"
import { AlbumCard } from "@/components/album-card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/toast"
import { DISCOVER_GENRES } from "@/lib/recommend"
import type { AlbumSummary, RecommendMode, Review } from "@/lib/types"

const genreItems = [
  { label: "Select a genre", value: null },
  ...DISCOVER_GENRES.map((genre) => ({
    label: genre,
    value: genre,
  })),
]

const decadeItems = [
  { label: "Any year", value: null },
  { label: "2020s", value: "2020" },
  { label: "2010s", value: "2010" },
  { label: "2000s", value: "2000" },
  { label: "1990s", value: "1990" },
  { label: "1980s", value: "1980" },
  { label: "1970s", value: "1970" },
  { label: "1960s", value: "1960" },
]

function parseDecade(value: string | null): {
  yearFrom?: number
  yearTo?: number
} {
  if (!value) return {}
  const start = Number(value)
  if (!Number.isFinite(start)) return {}
  return { yearFrom: start, yearTo: start + 9 }
}

type DiscoverPanelProps = {
  reviews: Review[]
}

export function DiscoverPanel({ reviews }: DiscoverPanelProps) {
  const [mode, setMode] = useState<RecommendMode>("surprise")
  const [genre, setGenre] = useState<string | null>(null)
  const [artist, setArtist] = useState("")
  const [decade, setDecade] = useState<string | null>(null)
  const [albums, setAlbums] = useState<AlbumSummary[]>([])
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const seeds = useMemo(() => {
    const liked = reviews.filter((review) => review.rating >= 4)
    const pool = liked.length > 0 ? liked : reviews
    const seedArtists = [
      ...new Set(pool.flatMap((review) => review.artists)),
    ].slice(0, 12)
    const seedYears = pool
      .map((review) => Number((review.releaseDate ?? "").slice(0, 4)))
      .filter((year) => Number.isFinite(year) && year > 1900)
    return {
      excludeIds: reviews.map((review) => review.spotifyId),
      seedArtists,
      seedYears,
    }
  }, [reviews])

  async function handleRecommend() {
    setLoading(true)
    setHasSearched(true)

    try {
      const years = parseDecade(decade)
      const response = await fetch("/api/spotify/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          genre: genre ?? undefined,
          artist: artist.trim() || undefined,
          yearFrom: years.yearFrom,
          yearTo: years.yearTo,
          excludeIds: seeds.excludeIds,
          seedArtists: seeds.seedArtists,
          seedYears: seeds.seedYears,
        }),
      })

      const data = (await response.json()) as {
        albums?: AlbumSummary[]
        reason?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load recommendations")
      }

      setAlbums(data.albums ?? [])
      setReason(data.reason ?? null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load recommendations"
      toast.add({
        title: "Could not recommend",
        description: message,
        type: "error",
      })
      setAlbums([])
      setReason(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-medium">How should we pick?</h2>
          <p className="text-sm text-muted-foreground">
            Rule-based recommendations from Spotify. Albums you already rated are
            skipped.
          </p>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel>Mode</FieldLabel>
            <ToggleGroup
              value={[mode]}
              onValueChange={(values) => {
                if (values[0]) setMode(values[0] as RecommendMode)
              }}
              spacing={2}
            >
              <ToggleGroupItem value="surprise">Surprise me</ToggleGroupItem>
              <ToggleGroupItem value="genre">Genre</ToggleGroupItem>
              <ToggleGroupItem value="artist">Artist</ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              {mode === "surprise"
                ? "Uses artists you rated 4+ stars when available."
                : mode === "genre"
                  ? "Browse by a Spotify genre tag."
                  : "Find more albums from one artist."}
            </FieldDescription>
          </Field>

          {mode === "genre" ? (
            <Field>
              <FieldLabel>Genre</FieldLabel>
              <Select
                items={genreItems}
                value={genre}
                onValueChange={(value) => setGenre(value as string | null)}
              >
                <SelectTrigger className="w-full min-w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {genreItems.map((item) => (
                      <SelectItem key={String(item.value)} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {mode === "artist" ? (
            <Field>
              <FieldLabel htmlFor="discover-artist">Artist</FieldLabel>
              <Input
                id="discover-artist"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                placeholder="e.g. Radiohead"
              />
            </Field>
          ) : null}

          {mode !== "artist" ? (
            <Field>
              <FieldLabel>Decade</FieldLabel>
              <Select
                items={decadeItems}
                value={decade}
                onValueChange={(value) => setDecade(value as string | null)}
              >
                <SelectTrigger className="w-full min-w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {decadeItems.map((item) => (
                      <SelectItem key={String(item.value)} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Optional year range filter.</FieldDescription>
            </Field>
          ) : null}

          <Field>
            <Button type="button" onClick={handleRecommend} disabled={loading}>
              {loading ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <SparklesIcon data-icon="inline-start" />
              )}
              {loading ? "Finding albums…" : "Get recommendations"}
            </Button>
          </Field>
        </FieldGroup>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && hasSearched && albums.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DicesIcon />
            </EmptyMedia>
            <EmptyTitle>No fresh albums</EmptyTitle>
            <EmptyDescription>
              Try another genre, artist, or surprise roll. Rated albums are
              excluded automatically.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!loading && albums.length > 0 ? (
        <section className="flex flex-col gap-4">
          {reason ? (
            <p className="text-sm text-muted-foreground">{reason}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
