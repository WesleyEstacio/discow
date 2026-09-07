"use client"

import { useState, useTransition } from "react"
import { HeartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  addFavoriteArtistAction,
  removeFavoriteArtistAction,
} from "@/lib/favorite-artist-actions"
import { cn } from "@/lib/utils"

export type FavoriteArtistButtonArtist = {
  spotifyId: string
  name: string
  imageUrl: string | null
  genres: string[]
}

export type FavoriteArtistButtonProps = {
  artist: FavoriteArtistButtonArtist
  initialFavorited: boolean
  className?: string
}

// Mirrors FavoriteButton (src/components/favorite-button.tsx) - same
// optimistic-flip-then-revert behavior, just for artists instead of albums.
export function FavoriteArtistButton({
  artist,
  initialFavorited,
  className,
}: FavoriteArtistButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const nextFavorited = !favorited
    setFavorited(nextFavorited)

    startTransition(async () => {
      const result = nextFavorited
        ? await addFavoriteArtistAction(artist)
        : await removeFavoriteArtistAction(artist.spotifyId)

      if (!result.success) {
        setFavorited(!nextFavorited)
        toast.add({
          title: nextFavorited ? "Could not favorite artist" : "Could not remove favorite",
          description: result.error,
          type: "error",
        })
      }
    })
  }

  return (
    <Button
      type="button"
      variant={favorited ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={favorited}
      className={className}
    >
      <HeartIcon
        data-icon="inline-start"
        className={cn(favorited && "fill-primary text-primary")}
      />
      {favorited ? "Favorited" : "Favorite"}
    </Button>
  )
}
