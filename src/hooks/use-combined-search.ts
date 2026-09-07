"use client"

import { useEffect, useState } from "react"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { AlbumSummary, ArtistSummary, UserSummary } from "@/lib/types"

export type CombinedSearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; albums: AlbumSummary[]; artists: ArtistSummary[]; users: UserSummary[] }

type UseCombinedSearchOptions = {
  albumLimit?: number
  artistLimit?: number
  userLimit?: number
  debounceMs?: number
}

const DEFAULT_DEBOUNCE_MS = 400
const DEFAULT_ALBUM_LIMIT = 6
const DEFAULT_ARTIST_LIMIT = 4
const DEFAULT_USER_LIMIT = 4

type AlbumSearchResponse = { albums?: AlbumSummary[]; error?: string }
type ArtistSearchResponse = { artists?: ArtistSummary[]; error?: string }
type UserSearchResponse = { users?: UserSummary[]; error?: string }

/**
 * Backs every search surface in the app (header + library hero): debounces
 * the raw query, then fetches album, artist, and user matches in parallel so
 * one search box can show all three. Only reports an error when *every*
 * request fails - if just one or two of the three are down, their results
 * are simply omitted instead of blanking out what the others found fine.
 */
export function useCombinedSearch(rawQuery: string, options: UseCombinedSearchOptions = {}) {
  const {
    albumLimit = DEFAULT_ALBUM_LIMIT,
    artistLimit = DEFAULT_ARTIST_LIMIT,
    userLimit = DEFAULT_USER_LIMIT,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options

  const debouncedQuery = useDebouncedValue(rawQuery.trim(), debounceMs)
  const [state, setState] = useState<CombinedSearchState>({ status: "idle" })

  useEffect(() => {
    if (!debouncedQuery) {
      setState({ status: "idle" })
      return
    }

    const abortController = new AbortController()
    setState({ status: "loading" })

    function fallbackUnlessAborted<Response extends { error?: string }>(message: string) {
      return (error: unknown): Response => {
        if (error instanceof DOMException && error.name === "AbortError") throw error
        return { error: message } as Response
      }
    }

    // A leading "@" is a deliberate "I'm looking for a person" signal, so
    // skip the album/artist requests entirely instead of spending a round
    // trip on a query ("@wes") Spotify search was never going to match.
    const isUsernameQuery = debouncedQuery.startsWith("@")

    const albumRequest = isUsernameQuery
      ? Promise.resolve<AlbumSearchResponse>({ albums: [] })
      : fetch(
          `/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}&limit=${albumLimit}`,
          { signal: abortController.signal }
        )
          .then((response) => response.json() as Promise<AlbumSearchResponse>)
          .catch(fallbackUnlessAborted<AlbumSearchResponse>("Could not load albums."))

    const artistRequest = isUsernameQuery
      ? Promise.resolve<ArtistSearchResponse>({ artists: [] })
      : fetch(
          `/api/spotify/artists/search?q=${encodeURIComponent(debouncedQuery)}&limit=${artistLimit}`,
          { signal: abortController.signal }
        )
          .then((response) => response.json() as Promise<ArtistSearchResponse>)
          .catch(fallbackUnlessAborted<ArtistSearchResponse>("Could not load artists."))

    const userRequest = fetch(
      `/api/users/search?q=${encodeURIComponent(debouncedQuery)}&limit=${userLimit}`,
      { signal: abortController.signal }
    )
      .then((response) => response.json() as Promise<UserSearchResponse>)
      .catch(fallbackUnlessAborted<UserSearchResponse>("Could not load users."))

    Promise.all([albumRequest, artistRequest, userRequest])
      .then(([albumData, artistData, userData]) => {
        if (albumData.error && artistData.error && userData.error) {
          setState({ status: "error", message: albumData.error })
          return
        }
        setState({
          status: "success",
          albums: albumData.albums ?? [],
          artists: artistData.artists ?? [],
          users: userData.users ?? [],
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setState({ status: "error", message: "Could not load suggestions right now." })
      })

    return () => abortController.abort()
  }, [debouncedQuery, albumLimit, artistLimit, userLimit])

  return { debouncedQuery, state }
}
