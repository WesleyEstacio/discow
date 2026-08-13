"use client"

import { useState, useTransition } from "react"
import { HeartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  addFavoriteAlbumAction,
  removeFavoriteAlbumAction,
} from "@/lib/favorite-actions"
import type { FavoriteAlbum } from "@/lib/types"
import { cn } from "@/lib/utils"

export type FavoriteButtonAlbum = {
  spotifyId: string
  albumName: string
  artists: string[]
  imageUrl: string | null
  releaseDate: string | null
  totalTracks: number | null
}

export type FavoriteButtonProps = {
  album: FavoriteButtonAlbum
  initialFavorited: boolean
  className?: string
  // Lets a parent list (the Albums/Tracks tabs, where an item can start
  // unfavorited) append the new favorite immediately, instead of waiting for
  // the page to revalidate.
  onAdded?: (favorite: FavoriteAlbum) => void
  // Lets a parent list (the favorites shelves, where every card starts
  // favorited) drop the card immediately on a successful removal.
  onRemoved?: () => void
}

export function FavoriteButton({
  album,
  initialFavorited,
  className,
  onAdded,
  onRemoved,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    // Optimistic flip - reverted below if the server disagrees.
    const nextFavorited = !favorited
    setFavorited(nextFavorited)

    startTransition(async () => {
      const result = nextFavorited
        ? await addFavoriteAlbumAction(album)
        : await removeFavoriteAlbumAction(album.spotifyId)

      if (!result.success) {
        setFavorited(!nextFavorited)
        toast.add({
          title: nextFavorited ? "Could not favorite album" : "Could not remove favorite",
          description: result.error,
          type: "error",
        })
        return
      }

      if (nextFavorited) {
        onAdded?.({ ...album, createdAt: new Date().toISOString() })
      } else {
        onRemoved?.()
      }
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      disabled={isPending}
      onClick={handleClick}
      aria-label={favorited ? "Remove from favorite albums" : "Add to favorite albums"}
      aria-pressed={favorited}
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background",
        className
      )}
    >
      <HeartIcon className={cn(favorited && "fill-primary text-primary")} />
    </Button>
  )
}
