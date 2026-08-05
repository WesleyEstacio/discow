"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatReleaseYear } from "@/lib/format"
import type { PickAlbum, PickCollection } from "@/lib/types"
import { cn } from "@/lib/utils"

type PicksCollectionDialogProps = {
  collection: PickCollection
}

function spotifyAlbumUrl(albumId: string) {
  return `https://open.spotify.com/album/${albumId}`
}

/**
 * The clickable "Discows picks" card plus the modal it opens. Everything
 * here is static (no data fetching) - the collection comes fully-formed
 * from src/lib/picks.ts, so this component is just presentation and the
 * bit of client state needed for the featured carousel/tabs.
 */
export function PicksCollectionDialog({ collection }: PicksCollectionDialogProps) {
  const albumCount = collection.albums.length

  return (
    <Dialog>
      <DialogTrigger className="group flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left text-card-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
          {collection.cover ? (
            <Image
              src={collection.cover}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <SparklesIcon className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium leading-tight">{collection.title}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {collection.description}
          </p>
        </div>
        <span className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit pointer-events-none")}>
          Explore list
        </span>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        // A definite height (not just a cap) rather than max-h-[70vh] - the
        // List tab's scroll area needs a real, content-independent height
        // to size against (see ListView), and this also keeps the dialog
        // from resizing when switching between the Featured and List tabs.
        // Expressed purely as a viewport fraction (no rem cap) so it scales
        // with the window instead of settling on one fixed pixel size.
        className="flex h-[70vh] min-h-max w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">{collection.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {collection.description}
        </DialogDescription>

        <Tabs defaultValue="featured" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="flex items-center justify-between gap-3 border-b p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SparklesIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold">
                  Discows: {collection.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  by {collection.createdBy} · {albumCount} recommended albums
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TabsList>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
              <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
                <XIcon />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>

          <TabsContent value="featured" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <FeaturedView collection={collection} />
          </TabsContent>
          <TabsContent value="list" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ListView collection={collection} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function FeaturedView({ collection }: { collection: PickCollection }) {
  const [index, setIndex] = useState(0)
  const album = collection.albums[index]
  const total = collection.albums.length
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Keep the thumbnail strip synced to whichever album is featured, whether
  // it changed via the prev/next arrows or a direct thumbnail click - so the
  // active thumbnail is always scrolled into view instead of only updating
  // its ring and leaving it potentially offscreen.
  useEffect(() => {
    thumbnailRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [index])

  function goToPrevious() {
    setIndex((current) => (current - 1 + total) % total)
  }

  function goToNext() {
    setIndex((current) => (current + 1) % total)
  }

  if (!album) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <Link
            href={`/album/${album.id}`}
            className="group/cover relative mx-auto aspect-square w-40 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-muted shadow-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 sm:mx-0 sm:w-56"
          >
            <Image
              src={album.cover}
              alt={`${album.title} cover`}
              fill
              sizes="(max-width: 640px) 160px, 224px"
              className="object-cover transition-transform duration-300 group-hover/cover:scale-[1.02]"
              priority={index === 0}
            />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div>
                <Badge variant="secondary">#{index + 1}</Badge>
              </div>
              <p className="font-heading text-lg font-semibold sm:text-xl">
                {album.title}
              </p>
              <p className="text-sm text-muted-foreground">{album.artist}</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{formatReleaseYear(album.releaseDate)}</Badge>
              {album.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button render={<Link href={`/album/${album.id}`} />} nativeButton={false} size="sm">
                View details
              </Button>
              <Button
                render={
                  <a href={spotifyAlbumUrl(album.id)} target="_blank" rel="noreferrer" />
                }
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Open in Spotify
              </Button>
            </div>
          </div>
      </div>

      {total > 1 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={total <= 1}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={total <= 1}
            >
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>

        <ScrollAreaPrimitive.Root className="relative w-full">
          <ScrollAreaPrimitive.Viewport className="w-full">
            {/* The selected thumbnail's ring bleeds ~2px past its own box -
                without padding here, the viewport's overflow clipping cuts
                that ring off on whichever edges touch the row (most visibly
                the top). p-1.5 gives it room on every side; pb-3 adds extra
                clearance so the horizontal scrollbar doesn't sit on top of
                the images. */}
            <div className="flex w-max gap-2 p-1.5 pb-3">
              {collection.albums.map((thumbnail, thumbnailIndex) => (
                <button
                  key={thumbnail.id}
                  ref={(element) => {
                    thumbnailRefs.current[thumbnailIndex] = element
                  }}
                  type="button"
                  onClick={() => setIndex(thumbnailIndex)}
                  aria-label={`Show ${thumbnail.title}`}
                  aria-current={thumbnailIndex === index}
                  className={cn(
                    "relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-md outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring/50",
                    thumbnailIndex === index
                      ? "opacity-100 ring-2 ring-primary"
                      : "opacity-50 hover:opacity-80"
                  )}
                >
                  <Image src={thumbnail.cover} alt="" fill sizes="44px" className="object-cover" />
                </button>
              ))}
            </div>
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar orientation="horizontal" />
        </ScrollAreaPrimitive.Root>
        </div>
      ) : null}
    </div>
  )
}

function ListView({ collection }: { collection: PickCollection }) {
  return (
    // Composed from the raw primitives (instead of the shared <ScrollArea>)
    // because this needs the viewport to be absolutely positioned - giving
    // Root a percentage/flex height and letting Viewport be a plain "100%
    // height" block child of it doesn't actually work here: Viewport still
    // sizes itself to its content (all 50 rows, ~4000px) and silently
    // overflows Root instead of scrolling, which is what was clipping the
    // list before. Sizing Viewport with "absolute inset-0" against Root
    // (already position: relative) pins it to Root's real layout box
    // instead of an unreliable percentage, so it reliably scrolls.
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className="relative min-h-0 flex-1">
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted-foreground">{collection.description}</p>
          <ul className="flex flex-col gap-1.5">
            {collection.albums.map((album, index) => (
              <PickAlbumRow key={album.id} album={album} rank={index + 1} />
            ))}
          </ul>
        </div>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function PickAlbumRow({ album, rank }: { album: PickAlbum; rank: number }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border p-2 sm:p-2.5">
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        #{rank}
      </span>
      <Link
        href={`/album/${album.id}`}
        className="group/cover relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Image
          src={album.cover}
          alt={`${album.title} cover`}
          fill
          sizes="48px"
          className="object-cover transition-transform duration-300 group-hover/cover:scale-[1.05]"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{album.title}</p>
        <p className="truncate text-sm text-muted-foreground">{album.artist}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatReleaseYear(album.releaseDate)} · {album.genres.join(", ")}
        </p>
      </div>
      <Button
        render={<Link href={`/album/${album.id}`} />}
        nativeButton={false}
        size="sm"
        variant="secondary"
        className="shrink-0"
      >
        Open
      </Button>
    </li>
  )
}
