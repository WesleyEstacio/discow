"use client"

import { useState, useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { SignInButton } from "@/components/sign-in-button"
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
import { deleteReviewAction, saveReview } from "@/lib/reviews-actions"
import type { AlbumDetail, Review } from "@/lib/types"

type ReviewFormProps = {
  album: AlbumDetail
  initialReview: Review | null
  isSignedIn: boolean
}

export function ReviewForm({ album, initialReview, isSignedIn }: ReviewFormProps) {
  if (!isSignedIn) {
    return <SignInPrompt />
  }

  return (
    <ReviewFormFields key={album.id} album={album} initialReview={initialReview} />
  )
}

function SignInPrompt() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium">Your review</h2>
        <p className="text-sm text-muted-foreground">
          Sign in with Google to rate this album and save a review.
        </p>
      </div>
      <SignInButton />
    </div>
  )
}

type ReviewFormFieldsProps = {
  album: AlbumDetail
  initialReview: Review | null
}

function ReviewFormFields({ album, initialReview }: ReviewFormFieldsProps) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0)
  const [text, setText] = useState(initialReview?.text ?? "")
  const [hasReview, setHasReview] = useState(initialReview !== null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (rating <= 0) {
      toast.add({
        title: "Add a rating",
        description: "Pick at least half a star before saving.",
        type: "error",
      })
      return
    }

    startTransition(async () => {
      const result = await saveReview({
        spotifyId: album.id,
        albumName: album.name,
        artists: album.artists,
        imageUrl: album.imageUrl,
        releaseDate: album.releaseDate,
        rating,
        text,
      })

      if (!result.success) {
        toast.add({
          title: "Could not save review",
          description: result.error,
          type: "error",
        })
        return
      }

      setHasReview(true)
      toast.add({
        title: "Review saved",
        description: `${album.name} is now in your catalog.`,
        type: "success",
      })
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReviewAction(album.id)

      if (!result.success) {
        toast.add({
          title: "Could not remove review",
          description: result.error,
          type: "error",
        })
        return
      }

      setRating(0)
      setText("")
      setHasReview(false)
      toast.add({
        title: "Review removed",
        description: "This album was removed from your catalog.",
        type: "success",
      })
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium">Your review</h2>
        <p className="text-sm text-muted-foreground">
          Rate this album and leave a short note.
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
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save review"}
            </Button>
            {hasReview ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isPending}
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
