import "server-only"
import { musicBrainzMusicProvider } from "@/lib/studio/music-providers/musicbrainz-provider"
import { spotifyMusicProvider } from "@/lib/studio/music-providers/spotify-provider"
import type {
  ExternalAlbumResult,
  MusicProvider,
  MusicSearchQuery,
} from "@/lib/studio/music-providers/types"

export const MUSIC_PROVIDERS: MusicProvider[] = [spotifyMusicProvider, musicBrainzMusicProvider]

export type ProviderSearchOutcome = {
  provider: Pick<MusicProvider, "source" | "label" | "unsupportedFilters">
  albums: ExternalAlbumResult[]
  errorMessage: string | null
}

// Each provider is searched independently: one API being down or
// unconfigured only empties its own column instead of failing the search.
export async function searchAllMusicProviders(
  query: MusicSearchQuery
): Promise<ProviderSearchOutcome[]> {
  return Promise.all(
    MUSIC_PROVIDERS.map(async (provider): Promise<ProviderSearchOutcome> => {
      const providerSummary = {
        source: provider.source,
        label: provider.label,
        unsupportedFilters: provider.unsupportedFilters,
      }

      if (!provider.isConfigured()) {
        return { provider: providerSummary, albums: [], errorMessage: "Integração não configurada." }
      }

      try {
        return { provider: providerSummary, albums: await provider.searchAlbums(query), errorMessage: null }
      } catch (error) {
        console.error(`Studio music search failed for ${provider.source}`, error)
        return {
          provider: providerSummary,
          albums: [],
          errorMessage: "Não foi possível buscar agora. Tente novamente em instantes.",
        }
      }
    })
  )
}
