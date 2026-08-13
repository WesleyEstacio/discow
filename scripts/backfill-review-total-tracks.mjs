// One-off backfill for reviews saved before the review.total_tracks column
// existed (see drizzle/0012_add_review_total_tracks.sql and the comment on
// reviews.totalTracks in src/lib/db/schema.ts). Looks up each affected
// album's real track count on Spotify and fills it in, so profile stats can
// tell albums apart from tracks for reviews created before this feature -
// until this runs, those rows are treated as albums (see resolveReleaseKind()
// in src/lib/release-kind.ts), same as they were before the split existed.
//
// Plain JS (not TypeScript) on purpose, so it runs with plain `node` and
// doesn't need a project build step or an extra dev dependency.
//
// Run once, after applying the 0012 migration:
//   node --env-file=.env.local scripts/backfill-review-total-tracks.mjs
//
// (Node < 20.6 doesn't support --env-file - export DATABASE_URL,
// SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET yourself in that case.)

import { neon } from "@neondatabase/serverless"

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Run this with --env-file=.env.local.`)
  }
  return value
}

const sql = neon(requireEnv("DATABASE_URL"))

let tokenCache = null

async function getAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken
  }

  const clientId = requireEnv("SPOTIFY_CLIENT_ID")
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET")

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  })

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.accessToken
}

async function getTotalTracks(spotifyId) {
  const accessToken = await getAccessToken()
  const response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(
      `Spotify API error for ${spotifyId}: ${response.status} ${await response.text()}`
    )
  }

  const album = await response.json()
  return album.total_tracks
}

async function main() {
  const rows = await sql`SELECT DISTINCT spotify_id FROM review WHERE total_tracks IS NULL`
  console.log(`${rows.length} album(s) to backfill.`)

  let updated = 0
  for (const { spotify_id: spotifyId } of rows) {
    try {
      const totalTracks = await getTotalTracks(spotifyId)
      await sql`UPDATE review SET total_tracks = ${totalTracks} WHERE spotify_id = ${spotifyId}`
      updated += 1
      console.log(`  ${spotifyId} -> ${totalTracks} track(s)`)
    } catch (error) {
      console.error(`  ${spotifyId} failed:`, error instanceof Error ? error.message : error)
    }
    // This only runs once, so there's no rush - stay well clear of Spotify's
    // rate limit instead of racing through the list.
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  console.log(`Done. ${updated}/${rows.length} updated.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
