import type { Metadata } from "next"
import { Suspense } from "react"
import { AlbumCard } from "@/components/album-card"
import { SearchForm } from "@/components/search-form"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { searchAlbums } from "@/lib/spotify"
import { SearchIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Search",
}

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams
  const query = q.trim()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Search albums
        </h1>
        <p className="text-muted-foreground">
          Find albums on Spotify and open one to rate and review.
        </p>
        <SearchForm initialQuery={query} autoFocus />
      </div>

      {!query ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Start typing</EmptyTitle>
            <EmptyDescription>
              Try an album title or artist name.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {query ? (
        <Suspense key={query} fallback={<SearchResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : null}
    </main>
  )
}

async function SearchResults({ query }: { query: string }) {
  let albums: Awaited<ReturnType<typeof searchAlbums>> = []
  let errorMessage: string | null = null

  try {
    albums = await searchAlbums(query)
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to search albums"
  }

  if (errorMessage) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Search unavailable</EmptyTitle>
          <EmptyDescription>{errorMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (albums.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>
            Nothing matched &ldquo;{query}&rdquo;. Try another search.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {albums.length} result{albums.length === 1 ? "" : "s"} for &ldquo;
        {query}&rdquo;
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </section>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="aspect-square w-full rounded-xl" />
      ))}
    </div>
  )
}
