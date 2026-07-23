"use client"

import { useEffect, useState } from "react"
import { Trash2Icon } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { useAlbumReview } from "@/hooks/use-reviews"
import type { AlbumDetail } from "@/lib/types"

type ReviewFormProps = {
  album: AlbumDetail
}

export function ReviewForm({ album }: ReviewFormProps) {
  const { review, saveReview, removeReview, hydrated } = useAlbumReview(album.id)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")

  useEffect(() => {
    if (!hydrated) return
    setRating(review?.rating ?? 0)
    setText(review?.text ?? "")
  }, [hydrated, review])

  function handleSave() {
    if (rating <= 0) {
      toast.add({
        title: "Add a rating",
        description: "Pick at least half a star before saving.",
        type: "error",
      })
      return
    }

    saveReview({
      spotifyId: album.id,
      albumName: album.name,
      artists: album.artists,
      imageUrl: album.imageUrl,
      rating,
      text,
    })

    toast.add({
      title: "Review saved",
      description: `${album.name} is now in your catalog.`,
      type: "success",
    })
  }

  function handleDelete() {
    removeReview(album.id)
    setRating(0)
    setText("")
    toast.add({
      title: "Review removed",
      description: "This album was removed from your catalog.",
      type: "success",
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium">Your review</h2>
        <p className="text-sm text-muted-foreground">
          Rate this album and leave a short note. Saved locally on this device.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>Rating</FieldLabel>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <FieldDescription>
            {rating > 0 ? `${rating} / 5` : "Tap a star (half stars supported)"}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="review-text">Review</FieldLabel>
          <Textarea
            id="review-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What stood out? Favorite tracks, mood, production..."
            rows={5}
          />
        </Field>

        <Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleSave} disabled={!hydrated}>
              Save review
            </Button>
            {review ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={!hydrated}
              >
                <Trash2Icon data-icon="inline-start" />
                Remove
              </Button>
            ) : null}
          </div>
        </Field>
      </FieldGroup>
    </div>
  )
}
