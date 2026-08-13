"use client"

import Image from "next/image"
import { useState, useTransition } from "react"
import { Disc3Icon, PlusIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/toast"
import { addFavoriteAlbumAction } from "@/lib/favorite-actions"
import type { ReleaseKind } from "@/lib/release-kind"
import type { FavoriteAlbum } from "@/lib/types"

export type FavoriteCandidate = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  totalTracks: number | null
}

export type AddFavoriteDialogProps = {
  kind: ReleaseKind
  // Every album/track the person has reviewed but hasn't already favorited -
  // the only pool to pick a favorite from (no fresh Spotify search here,
  // just what's already in their catalog).
  candidates: FavoriteCandidate[]
  // Whether they have any reviews of this kind at all, regardless of how
  // many are already favorited - distinguishes "nothing rated yet" from
  // "everything rated is already a favorite" in the empty state below.
  hasAnyReviews: boolean
  onAdded: (favorite: FavoriteAlbum) => void
}

export function AddFavoriteDialog({
  kind,
  candidates,
  hasAnyReviews,
  onAdded,
}: AddFavoriteDialogProps) {
  const [open, setOpen] = useState(false)
  const [pendingSpotifyId, setPendingSpotifyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const kindLabel = kind === "album" ? "album" : "track"

  function handlePick(candidate: FavoriteCandidate) {
    setPendingSpotifyId(candidate.spotifyId)

    startTransition(async () => {
      const result = await addFavoriteAlbumAction(candidate)
      setPendingSpotifyId(null)

      if (!result.success) {
        toast.add({
          title: `Could not favorite ${kindLabel}`,
          description: result.error,
          type: "error",
        })
        return
      }

      onAdded({ ...candidate, createdAt: new Date().toISOString() })
      toast.add({
        title: "Added to favorites",
        description: candidate.albumName,
        type: "success",
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex flex-col gap-3 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary">
          <PlusIcon className="size-8" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Add favorite</p>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a favorite {kindLabel}</DialogTitle>
          <DialogDescription>
            Pick from {kindLabel}s you&apos;ve already rated.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {hasAnyReviews
              ? `All your rated ${kindLabel}s are already favorites.`
              : `Rate a${kind === "album" ? "n" : ""} ${kindLabel} first to be able to favorite it.`}
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="flex flex-col gap-1 pr-2">
              {candidates.map((candidate) => (
                <li key={candidate.spotifyId}>
                  <button
                    type="button"
                    onClick={() => handlePick(candidate)}
                    disabled={pendingSpotifyId !== null}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {candidate.imageUrl ? (
                        <Image
                          src={candidate.imageUrl}
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
                      <p className="truncate text-sm font-medium">
                        {candidate.albumName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {candidate.artists.join(", ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
