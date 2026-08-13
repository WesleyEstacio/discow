// Pure helper, split out the same way src/lib/tag-utils.ts is: no
// "server-only" restriction, so it can run both in server code (profile
// stats) and later in client components if a release-kind badge needs it.
export type ReleaseKind = "album" | "track"

// A release with exactly 1 track counts as a track (a single); anything
// else counts as an album. `totalTracks` is null for reviews saved before
// review.totalTracks existed (see drizzle/0012_add_review_total_tracks.sql)
// - those are treated as albums, matching how every review was labeled
// "Album" before this distinction existed, until
// scripts/backfill-review-total-tracks.mjs fills in the real value.
export function resolveReleaseKind(totalTracks: number | null): ReleaseKind {
  return totalTracks === 1 ? "track" : "album"
}
