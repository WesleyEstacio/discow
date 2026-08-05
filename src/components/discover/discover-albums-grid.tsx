"use client"

import { useState } from "react"
import { AlbumCard } from "@/components/album-card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { CommunityRating } from "@/lib/discover"
import type { AlbumSummary } from "@/lib/types"

type DiscoverAlbumsGridProps = {
  albums: AlbumSummary[]
  communityRatings: Record<string, CommunityRating>
}

// History is capped at MAX_DISCOVER_HISTORY_ENTRIES (24, see
// src/lib/discover.ts), so pagination never has more than 3 pages - no need
// for ellipsis/truncation in the page number list below.
const PAGE_SIZE = 10

// Always a grid - Discover doesn't offer the list view the Library page
// does, since this is the listener's own roll history (newest first), not a
// sortable catalogue.
export function DiscoverAlbumsGrid({ albums, communityRatings }: DiscoverAlbumsGridProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(albums.length / PAGE_SIZE))
  // Clamped rather than stored - if the history shrinks (or a later roll
  // changes the count) while sitting on a now out-of-range page, this falls
  // back to the last valid page instead of rendering an empty one.
  const currentPage = Math.min(page, totalPages)
  const pageAlbums = albums.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-xl font-medium">Albums</h2>
        <Badge variant="secondary">{albums.length}</Badge>
      </div>

      {albums.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pageAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                rating={communityRatings[album.id]?.average ?? null}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing discovered yet</EmptyTitle>
            <EmptyDescription>Roll Surprise Me to start your discovery history.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}
