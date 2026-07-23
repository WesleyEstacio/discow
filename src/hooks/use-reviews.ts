"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import {
  deleteReview,
  getReviews,
  refreshReviewsCache,
  upsertReview,
  type UpsertReviewInput,
} from "@/lib/reviews-store"
import type { Review } from "@/lib/types"

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  const onStorage = (event: StorageEvent) => {
    if (event.key === "discow:reviews") {
      refreshReviewsCache()
      emitChange()
    }
  }

  window.addEventListener("storage", onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  return getReviews()
}

function getServerSnapshot(): Review[] {
  return EMPTY_REVIEWS
}

const EMPTY_REVIEWS: Review[] = []

export function useReviews() {
  const reviews = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const saveReview = useCallback((input: UpsertReviewInput) => {
    const saved = upsertReview(input)
    emitChange()
    return saved
  }, [])

  const removeReview = useCallback((spotifyId: string) => {
    deleteReview(spotifyId)
    emitChange()
  }, [])

  return { reviews, saveReview, removeReview }
}

export function useAlbumReview(spotifyId: string) {
  const { reviews, saveReview, removeReview } = useReviews()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const review = hydrated
    ? (reviews.find((item) => item.spotifyId === spotifyId) ?? null)
    : null

  return { review, saveReview, removeReview, hydrated }
}
