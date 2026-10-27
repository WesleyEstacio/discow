import type { StudioAlbumSource, StudioCoverSource } from "@/lib/db/schema"

export const ALBUM_SOURCE_LABELS: Record<StudioAlbumSource, string> = {
  spotify: "Spotify",
  musicbrainz: "MusicBrainz",
  manual: "Cadastro manual",
}

export const COVER_SOURCE_LABELS: Record<StudioCoverSource, string> = {
  spotify: "Spotify",
  "cover-art-archive": "Cover Art Archive",
  custom: "Imagem própria",
}

export function formatArtistNames(artistNames: string[]): string {
  return artistNames.join(", ")
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" })
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
})

export function formatStudioDate(date: Date): string {
  return dateFormatter.format(date)
}

export function formatStudioDateTime(date: Date): string {
  return dateTimeFormatter.format(date)
}
