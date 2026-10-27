import Link from "next/link"
import { ArrowLeftIcon, CheckIcon, PlusIcon, SearchIcon, TriangleAlertIcon } from "lucide-react"
import { FormSubmitButton } from "@/components/studio/form-submit-button"
import { StudioCoverImage } from "@/components/studio/studio-cover-image"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveExternalAlbumAction } from "@/lib/studio/album-actions"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { findSavedAlbumIdsByExternalId } from "@/lib/studio/albums"
import { formatArtistNames } from "@/lib/studio/labels"
import { searchAllMusicProviders, type ProviderSearchOutcome } from "@/lib/studio/music-providers"
import { hasSearchCriteria, type MusicSearchQuery } from "@/lib/studio/music-providers/types"

export const metadata = { title: "Buscar álbuns" }

const FILTER_LABELS: Record<keyof MusicSearchQuery, string> = {
  text: "álbum",
  artist: "artista",
  year: "ano",
  genre: "gênero",
}

type MusicSearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(value: string | string[] | undefined): string {
  return ((Array.isArray(value) ? value[0] : value) ?? "").trim().slice(0, 120)
}

export default async function MusicSearchPage({ searchParams }: MusicSearchPageProps) {
  await requireStudioAdmin()
  const params = await searchParams
  const query: MusicSearchQuery = {
    text: readSearchParam(params.q),
    artist: readSearchParam(params.artist),
    year: readSearchParam(params.year),
    genre: readSearchParam(params.genre),
  }
  const returnTo = readSearchParam(params.returnTo)
  const outcomes = hasSearchCriteria(query) ? await searchAllMusicProviders(query) : []

  return (
    <>
      <StudioPageHeader
        eyebrow="Biblioteca musical"
        title="Buscar álbuns"
        description="Pesquise no Spotify e no MusicBrainz ao mesmo tempo. Se uma fonte falhar, a outra continua funcionando."
        actions={
          <Button
            variant="ghost"
            render={<Link href={returnTo.startsWith("/studio") ? returnTo : "/studio/music"} />}
            nativeButton={false}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar
          </Button>
        }
      />

      <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr_auto] lg:items-end" role="search">
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-text">Título do álbum</Label>
            <Input id="search-text" name="q" defaultValue={query.text} placeholder="Ex.: Clube da Esquina" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-artist">Artista</Label>
            <Input id="search-artist" name="artist" defaultValue={query.artist} placeholder="Ex.: Milton Nascimento" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-year">Ano</Label>
            <Input id="search-year" name="year" defaultValue={query.year} inputMode="numeric" placeholder="Ex.: 1972" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-genre">Gênero</Label>
            <Input id="search-genre" name="genre" defaultValue={query.genre} placeholder="Ex.: mpb" />
          </div>
          <Button type="submit">
            <SearchIcon data-icon="inline-start" />
            Buscar
          </Button>
        </form>

        {hasSearchCriteria(query) ? (
          outcomes.map((outcome) => (
            <ProviderResults key={outcome.provider.source} outcome={outcome} query={query} returnTo={returnTo} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Preencha pelo menos um campo. Não achou o álbum?{" "}
            <Link href="/studio/music/new" className="underline underline-offset-4 hover:text-foreground">
              Cadastre manualmente
            </Link>
            .
          </p>
        )}
      </div>
    </>
  )
}

async function ProviderResults({
  outcome,
  query,
  returnTo,
}: {
  outcome: ProviderSearchOutcome
  query: MusicSearchQuery
  returnTo: string
}) {
  const savedAlbumIdsByExternalId = await findSavedAlbumIdsByExternalId(
    outcome.provider.source,
    outcome.albums.map((album) => album.externalId)
  )
  const ignoredFilters = outcome.provider.unsupportedFilters.filter((filter) => query[filter])

  return (
    <section aria-labelledby={`results-${outcome.provider.source}`} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <h2 id={`results-${outcome.provider.source}`} className="font-heading text-lg font-medium">
          {outcome.provider.label}
        </h2>
        {ignoredFilters.length ? (
          <p className="text-xs text-muted-foreground">
            Esta fonte não filtra por {ignoredFilters.map((filter) => FILTER_LABELS[filter]).join(", ")}.
          </p>
        ) : null}
      </div>

      {outcome.errorMessage ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <TriangleAlertIcon className="size-4" aria-hidden="true" />
          {outcome.errorMessage}
        </p>
      ) : outcome.albums.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum resultado nesta fonte.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {outcome.albums.map((album) => {
            const savedAlbumId = savedAlbumIdsByExternalId.get(album.externalId)
            return (
              <li key={album.externalId} className="flex flex-col gap-3">
                <StudioCoverImage coverImageUrl={album.coverImageUrl} albumTitle={album.title} className="w-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <p className="line-clamp-2 font-medium leading-snug">{album.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {formatArtistNames(album.artistNames) || "Artista desconhecido"}
                    {album.releaseYear ? ` · ${album.releaseYear}` : ""}
                  </p>
                  {album.genres.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {album.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="secondary">{genre}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                {savedAlbumId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/studio/music/${savedAlbumId}`} />}
                    nativeButton={false}
                  >
                    <CheckIcon data-icon="inline-start" />
                    Na biblioteca
                  </Button>
                ) : (
                  <form action={saveExternalAlbumAction}>
                    <input type="hidden" name="album" value={JSON.stringify(album)} />
                    {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                    <FormSubmitButton size="sm" className="w-full" pendingLabel="Salvando…">
                      <PlusIcon data-icon="inline-start" />
                      Salvar na biblioteca
                    </FormSubmitButton>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
